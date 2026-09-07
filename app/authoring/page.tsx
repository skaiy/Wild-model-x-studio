'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  assignUnclassified,
  buildPackManifest,
  bulkUpdatePieces,
  createPackFromParse,
  deletePack,
  deleteSystem,
  exportSqliteFile,
  getPackGlb,
  listPacks,
  listPieces,
  listSystems,
  resetSystemsToOemTemplate,
  resolveSystemId,
  updatePackMeta,
  updatePiece,
  upsertSystem,
} from '@/lib/authoring/db';
import {csvToPiecePatches, downloadBytes, downloadText, piecesToCsv} from '@/lib/authoring/csv';
import {createGlbObjectUrl, parseModelFile} from '@/lib/authoring/model-import';
import {PackScene} from '@/lib/authoring/pack-scene';
import type {PackRow, PieceRow, SystemRow} from '@/lib/authoring/types';

type Tab = 'packs' | 'systems' | 'editor';

export default function AuthoringPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<Tab>('packs');
  const [systems, setSystems] = useState<SystemRow[]>([]);
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [activePackId, setActivePackId] = useState('');
  const [pieces, setPieces] = useState<PieceRow[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState('');
  const [explode, setExplode] = useState(0);
  const [isolated, setIsolated] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [systemDraft, setSystemDraft] = useState<SystemRow>({
    id: '',
    nameZh: '',
    nameEn: '',
    sortOrder: 100,
    color: '#8a96a2',
    descriptionZh: '',
    descriptionEn: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async (packId?: string) => {
    const [nextSystems, nextPacks] = await Promise.all([listSystems(), listPacks()]);
    setSystems(nextSystems);
    setPacks(nextPacks);
    const id = packId || activePackId || nextPacks[0]?.id || '';
    setActivePackId(id);
    if (!id) {
      setPieces([]);
      setModelUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      return;
    }
    const nextPieces = await listPieces(id);
    setPieces(nextPieces);
    const glb = await getPackGlb(id);
    setModelUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return glb ? createGlbObjectUrl(glb) : null;
    });
  }, [activePackId]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : '初始化失败');
      }
    })();
  }, []);

  const activePack = packs.find((p) => p.id === activePackId) || null;
  const selectedPiece = pieces.find((p) => p.id === selectedPieceId) || null;
  const unclassified = pieces.filter((p) => !p.systemId).length;

  const scenePieces = useMemo(
    () =>
      pieces.map((p) => ({
        id: p.id,
        systemId: p.systemId || 'other',
        label: p.label,
      })),
    [pieces],
  );

  async function onUpload(file: File) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const parsed = await parseModelFile(file);
      const known = new Set(systems.map((s) => s.id));
      const packId = await createPackFromParse({
        name: file.name.replace(/\.[^.]+$/, ''),
        sourceFilename: parsed.filename,
        sourceFormat: parsed.format,
        glbBytes: parsed.glbBytes,
        faceCount: parsed.faceCount,
        meshCount: parsed.meshCount,
        warningSolid: parsed.warningSolid,
        pieces: parsed.pieces.map((p) => ({
          ...p,
          systemId: resolveSystemId(p.systemId, known),
        })),
      });
      setTab('editor');
      setActivePackId(packId);
      await refresh(packId);
      setNotice(
        [
          `已导入 ${parsed.meshCount} 片 / ${parsed.faceCount.toLocaleString()} 面`,
          ...parsed.warnings,
          '可导出索引 CSV，在表格中补全 system_id / label / business_key 后再导入。',
        ].join('；'),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败');
    } finally {
      setBusy(false);
    }
  }

  async function openPack(id: string) {
    setActivePackId(id);
    setTab('editor');
    setSelectedPieceId('');
    const nextPieces = await listPieces(id);
    setPieces(nextPieces);
    const glb = await getPackGlb(id);
    setModelUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return glb ? createGlbObjectUrl(glb) : null;
    });
    setPacks(await listPacks());
  }

  async function savePiecePatch(patch: Partial<Pick<PieceRow, 'systemId' | 'label' | 'businessKey'>>) {
    if (!activePackId || !selectedPieceId) return;
    await updatePiece(activePackId, selectedPieceId, patch);
    setPieces(await listPieces(activePackId));
    setPacks(await listPacks());
  }

  async function exportCsv() {
    if (!activePack) return;
    downloadText(`${activePack.name}-pieces.csv`, piecesToCsv(pieces));
    setNotice('已导出索引表。可在 Excel / WPS 中填写后导入。');
  }

  async function importCsvFile(file: File) {
    if (!activePackId) return;
    const text = await file.text();
    const patches = csvToPiecePatches(text);
    const known = new Set(systems.map((s) => s.id));
    const normalized = patches.map((p) => ({
      ...p,
      systemId: p.systemId && !known.has(p.systemId) ? null : p.systemId,
    }));
    const updated = await bulkUpdatePieces(activePackId, normalized);
    setPieces(await listPieces(activePackId));
    setPacks(await listPacks());
    setNotice(`CSV 已导入，更新 ${updated} 条。未知 system_id 已置空。`);
  }

  async function publishPack() {
    if (!activePackId || !activePack) return;
    const manifest = await buildPackManifest(activePackId);
    const glb = await getPackGlb(activePackId);
    if (!manifest || !glb) return;
    downloadBytes(`${activePack.name}.glb`, glb, 'model/gltf-binary');
    downloadText(`${activePack.name}-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, 'application/json');
    setNotice('已下载 GLB + manifest.json 播放包。');
  }

  async function saveSystem() {
    if (!systemDraft.id.trim() || !systemDraft.nameZh.trim()) {
      setError('系统 ID 与中文名必填');
      return;
    }
    const id = systemDraft.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    await upsertSystem({...systemDraft, id});
    setSystems(await listSystems());
    setSystemDraft({
      id: '',
      nameZh: '',
      nameEn: '',
      sortOrder: 100,
      color: '#8a96a2',
      descriptionZh: '',
      descriptionEn: '',
    });
    setNotice('系统已保存');
  }

  if (!ready && !error) {
    return <main className="authoring-shell"><p className="authoring-muted">正在加载本地 SQLite…</p></main>;
  }

  return (
    <main className="authoring-shell">
      <header className="authoring-top">
        <div>
          <p className="authoring-kicker">Wild Authoring</p>
          <h1>爆炸资产傻瓜后台</h1>
          <p className="authoring-muted">上传 GLB/glTF/FBX/OBJ → 自动分件 → 表格/点选归类 → 预览爆炸 → 发布播放包。数据存浏览器 SQLite（IndexedDB）。</p>
        </div>
        <div className="authoring-top-actions">
          <a href="/" className="authoring-btn ghost">返回演示</a>
          <button className="authoring-btn ghost" onClick={async () => downloadBytes('authoring.sqlite', new Uint8Array(await (await exportSqliteFile()).arrayBuffer()), 'application/x-sqlite3')}>导出 SQLite</button>
          <button className="authoring-btn" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? '解析中…' : '上传模型'}</button>
          <input ref={fileRef} hidden type="file" accept=".glb,.gltf,.fbx,.obj" onChange={(e) => {const f = e.target.files?.[0]; if (f) void onUpload(f); e.target.value = '';}} />
        </div>
      </header>

      {(error || notice) && (
        <div className={`authoring-banner ${error ? 'is-error' : ''}`}>
          {error || notice}
          <button onClick={() => {setError(''); setNotice('');}}>关闭</button>
        </div>
      )}

      <nav className="authoring-tabs">
        {([
          ['packs', '资产包'],
          ['systems', '系统库'],
          ['editor', '编辑与预览'],
        ] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === 'packs' && (
        <section className="authoring-panel">
          <div className="authoring-panel-head">
            <h2>资产包 CRUD</h2>
            <span className="authoring-muted">{packs.length} 个</span>
          </div>
          <div className="authoring-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>格式</th>
                  <th>片数</th>
                  <th>面数</th>
                  <th>合模告警</th>
                  <th>更新时间</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {packs.map((pack) => (
                  <tr key={pack.id}>
                    <td>{pack.name}</td>
                    <td>{pack.sourceFormat}</td>
                    <td>{pack.meshCount}</td>
                    <td>{pack.faceCount.toLocaleString()}</td>
                    <td>{pack.warningSolid ? '是' : '否'}</td>
                    <td>{new Date(pack.updatedAt).toLocaleString()}</td>
                    <td className="authoring-row-actions">
                      <button onClick={() => void openPack(pack.id)}>编辑</button>
                      <button onClick={async () => {await deletePack(pack.id); await refresh('');}}>删除</button>
                    </td>
                  </tr>
                ))}
                {!packs.length && <tr><td colSpan={7} className="authoring-muted">暂无资产包，请先上传模型。</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'systems' && (
        <section className="authoring-panel">
          <div className="authoring-panel-head">
            <h2>主机厂系统库（可配置）</h2>
            <button className="authoring-btn ghost" onClick={async () => {if (confirm('恢复 OEM 默认模板？现有系统将被替换，零件系统归类会清空。')) {await resetSystemsToOemTemplate(); setSystems(await listSystems()); setPieces(activePackId ? await listPieces(activePackId) : []);}}}>恢复默认模板</button>
          </div>
          <div className="authoring-grid-2">
            <div className="authoring-table-wrap">
              <table>
                <thead><tr><th>ID</th><th>中文</th><th>英文</th><th>排序</th><th /></tr></thead>
                <tbody>
                  {systems.map((s) => (
                    <tr key={s.id}>
                      <td><span className="swatch" style={{background: s.color}} />{s.id}</td>
                      <td>{s.nameZh}</td>
                      <td>{s.nameEn}</td>
                      <td>{s.sortOrder}</td>
                      <td className="authoring-row-actions">
                        <button onClick={() => setSystemDraft(s)}>编辑</button>
                        <button onClick={async () => {await deleteSystem(s.id); setSystems(await listSystems());}}>删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form className="authoring-form" onSubmit={(e) => {e.preventDefault(); void saveSystem();}}>
              <h3>{systemDraft.id && systems.some((s) => s.id === systemDraft.id) ? '编辑系统' : '新增系统'}</h3>
              <label>ID<input value={systemDraft.id} onChange={(e) => setSystemDraft({...systemDraft, id: e.target.value})} placeholder="body" /></label>
              <label>中文名<input value={systemDraft.nameZh} onChange={(e) => setSystemDraft({...systemDraft, nameZh: e.target.value})} placeholder="车身" /></label>
              <label>英文名<input value={systemDraft.nameEn} onChange={(e) => setSystemDraft({...systemDraft, nameEn: e.target.value})} placeholder="Body" /></label>
              <label>排序<input type="number" value={systemDraft.sortOrder} onChange={(e) => setSystemDraft({...systemDraft, sortOrder: Number(e.target.value)})} /></label>
              <label>颜色<input type="color" value={systemDraft.color} onChange={(e) => setSystemDraft({...systemDraft, color: e.target.value})} /></label>
              <label>中文说明<textarea value={systemDraft.descriptionZh} onChange={(e) => setSystemDraft({...systemDraft, descriptionZh: e.target.value})} rows={3} /></label>
              <button className="authoring-btn" type="submit">保存系统</button>
            </form>
          </div>
        </section>
      )}

      {tab === 'editor' && (
        <section className="authoring-editor">
          {!activePack ? (
            <p className="authoring-muted">请先在「资产包」中选择或上传模型。</p>
          ) : (
            <>
              <div className="authoring-editor-toolbar">
                <div>
                  <strong>{activePack.name}</strong>
                  <span className="authoring-muted"> · {pieces.length} 片 · 未分类 {unclassified}{activePack.warningSolid ? ' · 合模告警' : ''}</span>
                </div>
                <div className="authoring-top-actions">
                  <button className="authoring-btn ghost" onClick={() => void exportCsv()}>导出索引 CSV</button>
                  <button className="authoring-btn ghost" onClick={() => csvRef.current?.click()}>导入 CSV</button>
                  <input ref={csvRef} hidden type="file" accept=".csv,text/csv" onChange={(e) => {const f = e.target.files?.[0]; if (f) void importCsvFile(f); e.target.value = '';}} />
                  <button className="authoring-btn ghost" onClick={async () => {const n = await assignUnclassified(activePackId, 'other'); setPieces(await listPieces(activePackId)); setNotice(`已将 ${n} 片未分类归入 other`);}}>未分类→其他</button>
                  <button className="authoring-btn" onClick={() => void publishPack()}>发布 GLB+清单</button>
                </div>
              </div>

              <div className="authoring-editor-grid">
                <aside className="authoring-side">
                  <label className="authoring-field">
                    资产包名称
                    <input value={activePack.name} onChange={async (e) => {await updatePackMeta(activePackId, {name: e.target.value}); setPacks(await listPacks());}} />
                  </label>
                  <div className="authoring-piece-list">
                    {pieces.map((piece) => (
                      <button
                        key={piece.id}
                        className={`authoring-piece-row ${selectedPieceId === piece.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPieceId(piece.id)}
                      >
                        <span>{piece.id}</span>
                        <em>{systems.find((s) => s.id === piece.systemId)?.nameZh || '未分类'}</em>
                      </button>
                    ))}
                  </div>
                </aside>

                <div className="authoring-viewport">
                  <PackScene
                    modelUrl={modelUrl}
                    systems={systems}
                    pieces={scenePieces}
                    selectedPieceId={selectedPieceId}
                    selectedSystemId={selectedPiece?.systemId || 'other'}
                    explode={explode}
                    isolated={isolated}
                    onSelectPiece={setSelectedPieceId}
                  />
                  <div className="authoring-viewport-dock">
                    <label>爆炸 <input type="range" min={0} max={100} value={explode} onChange={(e) => setExplode(Number(e.target.value))} /></label>
                    <label><input type="checkbox" checked={isolated} onChange={(e) => setIsolated(e.target.checked)} /> 隔离当前系统</label>
                  </div>
                </div>

                <aside className="authoring-side">
                  <h3>片属性（businessKey 选填）</h3>
                  {!selectedPiece ? (
                    <p className="authoring-muted">在列表或 3D 中点选一片进行编辑。</p>
                  ) : (
                    <div className="authoring-form">
                      <label>ID<input value={selectedPiece.id} disabled /></label>
                      <label>
                        系统
                        <select
                          value={selectedPiece.systemId || ''}
                          onChange={(e) => void savePiecePatch({systemId: e.target.value || null})}
                        >
                          <option value="">未分类</option>
                          {systems.map((s) => <option key={s.id} value={s.id}>{s.nameZh} ({s.id})</option>)}
                        </select>
                      </label>
                      <label>
                        中文/显示名
                        <input value={selectedPiece.label} onChange={(e) => setPieces((all) => all.map((p) => p.id === selectedPiece.id ? {...p, label: e.target.value} : p))} onBlur={(e) => void savePiecePatch({label: e.target.value})} />
                      </label>
                      <label>
                        businessKey（选填）
                        <input value={selectedPiece.businessKey} placeholder="零件号 / MDS / 材料牌号" onChange={(e) => setPieces((all) => all.map((p) => p.id === selectedPiece.id ? {...p, businessKey: e.target.value} : p))} onBlur={(e) => void savePiecePatch({businessKey: e.target.value})} />
                      </label>
                      <p className="authoring-muted">source: {selectedPiece.source} · faces: {selectedPiece.faces}</p>
                    </div>
                  )}
                  <div className="authoring-help">
                    <h4>表格工作流</h4>
                    <ol>
                      <li>拆解后点「导出索引 CSV」</li>
                      <li>在表格中填写 system_id / label / business_key</li>
                      <li>再「导入 CSV」写回 SQLite</li>
                    </ol>
                  </div>
                </aside>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

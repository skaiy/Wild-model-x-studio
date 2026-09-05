import type {Lang} from './messages';

export type PartId = 'body'|'glass'|'doors'|'cabin'|'battery'|'drive'|'suspension'|'wheels';
// Every user-facing string on a system entry carries both locales; consumers
// pick one with `field[lang]`.
export type Localized = {en: string; zh: string};
export type Part = {id: PartId; name: Localized; category: Localized; tag: Localized; description: Localized; principle: Localized; specs: [Localized, Localized][]; source: string};

const manual = 'https://www.tesla.com/ownersmanual/modelx/en_us/';
export const parts: Part[] = [
{id:'body',
 name:{en:'Body & structure',zh:'车身与结构'},
 category:{en:'Exterior',zh:'外观'},
 tag:{en:'THE PROTECTIVE SHELL',zh:'守护之壳'},
 description:{en:'The body brings the vehicle together: an enclosed passenger space, crumple zones at either end, and a smooth exterior that guides air around the car.',zh:'车身将整车融为一体：封闭的乘员舱、前后两端的碰撞溃缩区，以及引导气流绕车身而过的平滑外形。'},
 principle:{en:'The structure carries loads around the cabin, while the hood and liftgate give access to separate front and rear storage areas.',zh:'车身结构让载荷绕开乘员舱传递；前备箱盖与尾门分别通向前、后两处独立的储物空间。'},
 specs:[[{en:'Role',zh:'作用'},{en:'Structure & protection',zh:'结构与防护'}],[{en:'Location',zh:'位置'},{en:'Vehicle exterior',zh:'车辆外部'}]],
 source:manual+'GUID-7A32EC01-A17E-42CC-A15B-2E0A39FD07AB.html'},
{id:'glass',
 name:{en:'Panoramic glass',zh:'全景玻璃'},
 category:{en:'Exterior',zh:'外观'},
 tag:{en:'A WIDER VIEW',zh:'更开阔的视野'},
 description:{en:'The expansive windshield sweeps up above the front seats, opening the cabin to more of the world outside.',zh:'宽大的前挡风玻璃向上延伸至前排座椅上方，让座舱拥抱更广阔的外部世界。'},
 principle:{en:'The windshield and side glazing create visibility around the vehicle. The overhead glass sections move with the falcon wing doors.',zh:'前挡风玻璃与侧窗玻璃提供车辆四周的视野；车顶玻璃随鹰翼门一同开启。'},
 specs:[[{en:'Role',zh:'作用'},{en:'Visibility & enclosure',zh:'视野与封闭性'}],[{en:'Position',zh:'位置'},{en:'Upper cabin',zh:'座舱上部'}]],
 source:manual+'GUID-F617DA3E-11C1-4FBA-98A7-A9C3828E3536.html'},
{id:'doors',
 name:{en:'Doors & falcon wings',zh:'车门与鹰翼门'},
 category:{en:'Exterior',zh:'外观'},
 tag:{en:'ENGINEERING THAT OPENS UP',zh:'向上开启的工程'},
 description:{en:'Two hinges give each rear door its distinctive upward motion. The door folds as it rises, making access possible in tighter spaces.',zh:'双铰链赋予每扇后车门标志性的向上开启动作。车门在升起时折叠，即使在狭窄空间也能从容进出。'},
 principle:{en:'Sensors check for obstacles while the powered hinges coordinate the opening path. Available clearance influences how high the door opens.',zh:'开启过程中传感器持续检测障碍物，电动铰链协同规划开启轨迹；可用空间决定了车门的开启高度。'},
 specs:[[{en:'Motion',zh:'运动方式'},{en:'Dual-hinged',zh:'双铰链'}],[{en:'Operation',zh:'操作'},{en:'Electrically powered',zh:'电动'}]],
 source:manual+'GUID-7A32EC01-A17E-42CC-A15B-2E0A39FD07AB.html'},
{id:'cabin',
 name:{en:'Passenger cabin',zh:'乘员座舱'},
 category:{en:'Interior',zh:'内饰'},
 tag:{en:'BUILT AROUND PEOPLE',zh:'以人为本'},
 description:{en:'The passenger space sits above the battery. Seats, restraints, controls and displays form the part of the vehicle you interact with every day.',zh:'乘员舱位于电池之上。座椅、安全带、控制装置与显示屏，构成你每天与车辆互动的部分。'},
 principle:{en:'A flat electric platform leaves room for multiple seating configurations. The imported model includes modeled seating and trim. Its cabin reflects the older source car; actual seating and controls vary by year and configuration.',zh:'平整的电动平台为多种座椅布局留出了空间。导入的模型包含建模的座椅与内饰，其座舱反映的是年代较早的源车型；实际座椅与控制装置因年款和配置而异。'},
 specs:[[{en:'Shown here',zh:'此处所示'},{en:'Source-model interior',zh:'源模型内饰'}],[{en:'Position',zh:'位置'},{en:'Above battery',zh:'电池上方'}]],
 source:manual+'GUID-F617DA3E-11C1-4FBA-98A7-A9C3828E3536.html'},
{id:'battery',
 name:{en:'High-voltage battery',zh:'高压电池'},
 category:{en:'Energy',zh:'能源'},
 tag:{en:'THE ENERGY FOUNDATION',zh:'能量基石'},
 description:{en:'A liquid-cooled lithium-ion battery stores the energy that powers the vehicle. Positioned beneath the cabin, it supplies the electric drive units.',zh:'液冷锂离子电池储存驱动车辆的能量。它布置在座舱下方，为电驱动单元供电。'},
 principle:{en:'Electrical energy flows to the motors during acceleration. During regenerative braking, the motors can convert vehicle motion back into energy stored in the battery.',zh:'加速时，电能流向电机；制动能量回收时，电机可将车辆的动能转化为电能，重新存入电池。'},
 specs:[[{en:'Chemistry',zh:'化学体系'},{en:'Lithium-ion',zh:'锂离子'}],[{en:'Cooling',zh:'冷却方式'},{en:'Liquid-cooled',zh:'液冷'}]],
 source:manual+'GUID-E414862C-CFA1-4A0B-9548-BE21C32CAA58.html'},
{id:'drive',
 name:{en:'Electric drive units',zh:'电驱动单元'},
 category:{en:'Powertrain',zh:'动力总成'},
 tag:{en:'ENERGY INTO MOTION',zh:'化能量为动力'},
 description:{en:'Electric motors turn stored energy into wheel torque. This dual-motor study places one drive unit at the front and another at the rear.',zh:'电机将储存的能量转化为车轮扭矩。本双电机研究模型在前、后各布置一个驱动单元。'},
 principle:{en:'An inverter controls each motor, and a fixed-ratio gearbox transfers rotation to the wheels. The motors also help slow the vehicle through regenerative braking.',zh:'逆变器控制每台电机，固定齿比变速箱将旋转传递至车轮；电机还能通过制动能量回收帮助车辆减速。'},
 specs:[[{en:'Layout',zh:'布局'},{en:'Front + rear',zh:'前 + 后'}],[{en:'Transmission',zh:'变速箱'},{en:'Single-speed',zh:'单速'}],[{en:'Configuration',zh:'配置'},{en:'Dual motor',zh:'双电机'}]],
 source:manual+'GUID-E414862C-CFA1-4A0B-9548-BE21C32CAA58.html'},
{id:'suspension',
 name:{en:'Adaptive suspension',zh:'自适应悬挂'},
 category:{en:'Chassis',zh:'底盘'},
 tag:{en:'CONNECTED TO THE ROAD',zh:'与路相连'},
 description:{en:'Air springs support the car while adaptive dampers control body movement. The system can adjust ride height and the way the car responds to the road.',zh:'空气弹簧支撑车身，自适应减振器控制车身运动。系统可调节离地间隙以及车辆对路面的响应方式。'},
 principle:{en:'Front double-wishbone and rear multi-link suspension guide each wheel. Air pressure changes support height, while damping balances comfort with control.',zh:'前双叉臂、后多连杆悬挂引导每个车轮运动；气压变化调节支撑高度，阻尼则在舒适与操控之间取得平衡。'},
 specs:[[{en:'Springs',zh:'弹簧'},{en:'Air',zh:'空气弹簧'}],[{en:'Damping',zh:'阻尼'},{en:'Adaptive',zh:'自适应'}],[{en:'Height',zh:'高度'},{en:'Adjustable',zh:'可调节'}]],
 source:manual+'GUID-F1B6801A-8946-41AD-8CF9-7A963CDA38E4.html'},
{id:'wheels',
 name:{en:'Wheels & brakes',zh:'车轮与制动'},
 category:{en:'Chassis',zh:'底盘'},
 tag:{en:'WHERE MOTION MEETS GRIP',zh:'动力与抓地力交汇之处'},
 description:{en:'The tires are the vehicle’s contact with the road. Behind each wheel, a ventilated brake disc and caliper provide friction braking.',zh:'轮胎是车辆与路面的唯一接触点。每个车轮后方，通风制动盘与卡钳提供摩擦制动力。'},
 principle:{en:'Regenerative braking recovers energy through the motors. Friction brakes provide additional stopping force, with ABS helping control wheel slip.',zh:'制动能量回收通过电机回收能量；摩擦制动提供额外的制动力，ABS 帮助控制车轮打滑。'},
 specs:[[{en:'Brakes',zh:'制动'},{en:'Ventilated discs',zh:'通风盘式'}],[{en:'Control',zh:'控制'},{en:'Four-wheel ABS',zh:'四轮 ABS'}],[{en:'Energy recovery',zh:'能量回收'},{en:'Regenerative braking',zh:'制动能量回收'}]],
 source:manual+'GUID-E414862C-CFA1-4A0B-9548-BE21C32CAA58.html'},
];

// The GLB manifest labels follow a fixed grammar: `{base} · left/right · front/rear`.
// Translating the 21 base names plus the four suffixes covers all 334 pieces at
// runtime, so the manifest JSON itself never needs editing.
const pieceBaseNames: Record<string, Localized> = {
 'Hood': {en:'Hood',zh:'前备箱盖'},
 'Front bumper': {en:'Front bumper',zh:'前保险杠'},
 'Rear bumper': {en:'Rear bumper',zh:'后保险杠'},
 'Liftgate panel': {en:'Liftgate panel',zh:'尾门面板'},
 'Front door panel': {en:'Front door panel',zh:'前门板'},
 'Falcon wing door panel': {en:'Falcon wing door panel',zh:'鹰翼门面板'},
 'Fender / quarter panel': {en:'Fender / quarter panel',zh:'翼子板 / 后侧围板'},
 'Glazing': {en:'Glazing',zh:'玻璃'},
 'Body trim and seals': {en:'Body trim and seals',zh:'车身饰件与密封条'},
 'Rear lighting element': {en:'Rear lighting element',zh:'后灯组元件'},
 'Front lighting element': {en:'Front lighting element',zh:'前灯组元件'},
 'Tesla emblem': {en:'Tesla emblem',zh:'Tesla 徽标'},
 'Side mirror': {en:'Side mirror',zh:'外后视镜'},
 'Chrome trim': {en:'Chrome trim',zh:'镀铬饰件'},
 'Lower trim and liner': {en:'Lower trim and liner',zh:'下部饰板与内衬'},
 'Tire and tread': {en:'Tire and tread',zh:'轮胎与胎面'},
 'Brake disc': {en:'Brake disc',zh:'制动盘'},
 'Wheel fastener': {en:'Wheel fastener',zh:'车轮紧固件'},
 'Alloy wheel detail': {en:'Alloy wheel detail',zh:'合金轮毂细节'},
 'Interior trim and seating': {en:'Interior trim and seating',zh:'内饰与座椅'},
 'Exterior detail': {en:'Exterior detail',zh:'外观细节件'},
};
const labelSuffixes: Record<string, Localized> = {
 'left': {en:'left',zh:'左'},
 'right': {en:'right',zh:'右'},
 'front': {en:'front',zh:'前'},
 'rear': {en:'rear',zh:'后'},
};

// "Tire and tread · left · front" → "轮胎与胎面 · 左前" (unknown segments pass through).
export function translatePieceLabel(label: string, lang: Lang): string {
 if (lang === 'en') return label;
 const segments = label.split(' · ');
 const base = pieceBaseNames[segments[0]]?.zh ?? segments[0];
 const suffixes = segments.slice(1).map(s => labelSuffixes[s]?.zh ?? s);
 return suffixes.length ? `${base} · ${suffixes.join('')}` : base;
}

const pieceExplanations: Record<string, Localized> = {
 'Hood': {en:'The hood closes the front luggage compartment. Its outer surface continues the body’s aerodynamic shape, while hinges and a latch allow access to the storage space.',zh:'前备箱盖封闭车辆前部的行李舱。其外表面延续车身的空气动力学造型，铰链与锁扣则提供通往储物空间的通道。'},
 'Front bumper': {en:'The front bumper cover forms the nose of the vehicle and surrounds its lower openings. The visible cover is separate from the impact structure behind it.',zh:'前保险杠蒙皮构成车头造型并环绕下部开口。可见的蒙皮与其后方的碰撞吸能结构是相互独立的部件。'},
 'Rear bumper': {en:'The rear bumper cover finishes the lower rear body. It is the visible outer panel, rather than the impact beam hidden underneath.',zh:'后保险杠蒙皮收束车身后部下沿。它是可见的外覆盖件，而非隐藏其下的防撞梁。'},
 'Liftgate panel': {en:'The liftgate closes the rear cargo opening. It carries exterior trim and works with hinges, powered supports and a latch to provide access to the trunk.',zh:'尾门封闭后部行李舱开口。它承载外部饰件，并与铰链、电动撑杆和锁扣配合，提供通往后备箱的通道。'},
 'Front door panel': {en:'This panel forms part of a conventionally hinged front door. The complete door also contains glazing, a latch, seals and interior trim.',zh:'该面板属于传统铰链式前门。完整的车门还包含玻璃、锁扣、密封条与内饰件。'},
 'Falcon wing door panel': {en:'This panel belongs to the rear door assembly. On the real car, two hinges coordinate its upward folding motion; this explorer separates the geometry rather than simulating the exact hinge path.',zh:'该面板属于后车门总成。实车上双铰链协同完成向上折叠的开启动作；本拆解模型仅分离几何体，未模拟真实的铰链轨迹。'},
 'Fender / quarter panel': {en:'This exterior panel shapes the body around a wheel opening. Its position helps enclose the wheel well and connects the silhouette to adjacent doors and bumpers.',zh:'该外覆盖件围绕轮拱塑造车身轮廓。其位置有助于封闭轮舱，并将车身剪影与相邻车门和保险杠衔接起来。'},
 'Glazing': {en:'This is a modeled section of vehicle glazing. Depending on its location, it provides forward, side or rear visibility, or an overhead view. The dark tint here is a rendering material.',zh:'这是车辆玻璃的一个建模截面。视所在位置不同，它提供前向、侧向、后向视野或车顶视野；此处的深色着色仅为渲染材质。'},
 'Body trim and seals': {en:'Trim finishes panel edges and transitions; seals help close gaps against weather and noise. This mesh is a visual representation, not a separately verified replacement part.',zh:'饰件收边并覆盖板件接缝，密封条则帮助阻挡风雨与噪声。该网格为视觉示意，并非经过核实的独立替换零件。'},
 'Rear lighting element': {en:'A rear lamp element helps communicate the vehicle’s presence and driving intentions. The asset separates lamp shapes, but does not specify the electrical function of every individual lens.',zh:'后部灯组元件用于传递车辆的存在感与驾驶意图。模型拆分出了灯体形状，但未标明每个独立灯罩的电气功能。'},
 'Front lighting element': {en:'This shape belongs to the front lighting assembly. The complete assembly combines lenses, light sources and reflectors to illuminate the road or signal the vehicle’s presence.',zh:'该形状属于前照明总成。完整总成由灯罩、光源与反射镜组成，用于照亮路面或示意车辆的存在。'},
 'Tesla emblem': {en:'The exterior emblem identifies the vehicle’s maker. It is a decorative badge rather than part of the propulsion or body structure.',zh:'车外徽标表明车辆的制造者。它是装饰性标识，不属于动力系统或车身结构。'},
 'Side mirror': {en:'The mirror provides a view alongside and behind the vehicle. The full assembly includes the reflective glass, housing and adjustment mechanism.',zh:'外后视镜提供车辆侧后方的视野。完整总成包含镜面玻璃、外壳与调节机构。'},
 'Chrome trim': {en:'This metallic trim finishes an exterior edge or accent. Its appearance and placement reflect the older Model X represented by the source artist.',zh:'该金属饰件用于收束车身外沿或作为点缀。其外观与布置反映了源模型作者所刻画的早期款 Model X。'},
 'Lower trim and liner': {en:'This modeled piece forms part of the lower body finish or a liner. Such pieces cover exposed areas and help manage spray, debris and airflow.',zh:'该建模件属于车身下部饰板或内衬，用于覆盖裸露区域，并帮助疏导泥水、碎屑与气流。'},
 'Tire and tread': {en:'The tire is the contact surface between the vehicle and the road. Its rubber compound, tread and inflation support the load and influence grip, comfort and rolling resistance.',zh:'轮胎是车辆与路面之间的接触面。其橡胶配方、胎面花纹与胎压共同承载车重，并影响抓地力、舒适性与滚动阻力。'},
 'Brake disc': {en:'The brake disc turns with the wheel. Brake pads clamp it to convert motion into heat during friction braking, supplementing the motors’ regenerative braking.',zh:'制动盘随车轮一同旋转。摩擦制动时制动片夹紧制动盘，将动能转化为热量，与电机的制动能量回收互为补充。'},
 'Wheel fastener': {en:'Wheel fasteners clamp the wheel to its hub. This is the source artist’s geometry; it does not supply a verified thread specification or service torque.',zh:'车轮紧固件将车轮压紧在轮毂上。此为源模型作者的几何体，未提供经核实的螺纹规格或维修扭矩。'},
 'Alloy wheel detail': {en:'This mesh is part of the modeled alloy wheel. The wheel supports the tire and transfers loads between it and the hub; spokes connect the hub area to the rim.',zh:'该网格是建模合金轮毂的一部分。车轮支撑轮胎，并在轮胎与轮毂之间传递载荷；轮辐连接轮毂与轮辋。'},
 'Interior trim and seating': {en:'This is a piece of the modeled passenger compartment. The source separates seating and trim into mesh islands without assigning manufacturer part numbers.',zh:'这是建模乘员舱的一部分。源模型将座椅与内饰拆分为独立网格，但未标注制造商零件号。'},
 'Exterior detail': {en:'This is an individual exterior mesh from the source model. Its precise service-part identity is unverified; use its placement and the system overview for context.',zh:'这是源模型中的一个独立外观网格。其对应的维修零件身份未经核实，请结合其位置与系统概览理解。'},
};

const fallbackPieceExplanation: Localized = {en:'This is a separate piece of the source model. Its label describes the visible geometry; an exact Tesla service-part identity is not supplied.',zh:'这是源模型中的一个独立零件。标签描述的是可见几何体，未提供对应的 Tesla 维修零件身份。'};

export function describePiece(label: string, lang: Lang = 'en'): string {
 const name = label.split(' · ')[0];
 return (pieceExplanations[name] ?? fallbackPieceExplanation)[lang];
}

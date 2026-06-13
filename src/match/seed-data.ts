/**
 * 种子数据：来源于
 *   D:\claudeWork1\金融AI智能体\投资机构数据.csv
 *   D:\claudeWork1\金融AI智能体\项目方公司数据.csv
 * 表为空时由 MatchService 自动写入，便于本地/演示直接可用。
 */

export interface InstitutionSeed {
  name: string
  type: string
  fields: string
  stages: string
  amountMin: number
  amountMax: number
  city: string
  preference: string
  contact: string
  phone: string
}

export interface CompanySeed {
  name: string
  field: string
  foundedYear: number
  city: string
  stage: string
  fundingNeed: number
  valuation: number
  teamSize: number
  business: string
  contact: string
  phone: string
}

export const INSTITUTION_SEED: InstitutionSeed[] = [
  { name: '启明天使基金', type: '天使投资', fields: '人工智能/企业服务', stages: '天使轮/Pre-A', amountMin: 300, amountMax: 800, city: '北京', preference: '偏好技术驱动型早期团队、核心成员有大厂背景', contact: '李文博', phone: '010-88880001' },
  { name: '红杉种子基金', type: '创投VC', fields: '医疗健康/生物科技', stages: '天使轮/A轮', amountMin: 1000, amountMax: 3000, city: '上海', preference: '关注创始团队学术背景与临床资源', contact: '王晓琳', phone: '021-66660002' },
  { name: '蓝海资本', type: '天使投资', fields: '消费/电商/新零售', stages: '天使轮', amountMin: 200, amountMax: 500, city: '杭州', preference: '看重市场增长速度与用户复购率', contact: '张伟', phone: '0571-55550003' },
  { name: '远见创投', type: '创投VC', fields: '新能源/硬件/芯片', stages: 'A轮/B轮', amountMin: 2000, amountMax: 5000, city: '深圳', preference: '偏好有量产能力和核心专利的项目', contact: '陈思远', phone: '0755-77770004' },
  { name: '联创金融科技基金', type: '天使投资', fields: '金融科技/企业服务', stages: 'Pre-A/A轮', amountMin: 500, amountMax: 1500, city: '广州', preference: '关注合规风控能力与盈利模型', contact: '刘洋', phone: '020-99990005' }
]

export const COMPANY_SEED: CompanySeed[] = [
  { name: '智言科技', field: '人工智能', foundedYear: 2023, city: '北京', stage: '天使轮', fundingNeed: 500, valuation: 3000, teamSize: 12, business: '面向企业的智能客服大模型', contact: '周航', phone: '13800010001' },
  { name: '云栈数据', field: '企业服务', foundedYear: 2022, city: '北京', stage: 'Pre-A', fundingNeed: 1200, valuation: 8000, teamSize: 28, business: '一站式企业数据中台SaaS', contact: '何敏', phone: '13800010002' },
  { name: '康联医疗', field: '医疗健康', foundedYear: 2021, city: '上海', stage: 'A轮', fundingNeed: 2500, valuation: 20000, teamSize: 45, business: 'AI辅助影像诊断系统', contact: '赵宇', phone: '13800010003' },
  { name: '基因方舟', field: '生物科技', foundedYear: 2022, city: '上海', stage: '天使轮', fundingNeed: 1500, valuation: 12000, teamSize: 18, business: '肿瘤早筛基因检测', contact: '孙莉', phone: '13800010004' },
  { name: '鲜达优选', field: '消费/新零售', foundedYear: 2023, city: '杭州', stage: '天使轮', fundingNeed: 300, valuation: 2000, teamSize: 22, business: '社区生鲜即时零售', contact: '吴磊', phone: '13800010005' },
  { name: '潮玩星球', field: '消费/电商', foundedYear: 2022, city: '杭州', stage: '天使轮', fundingNeed: 400, valuation: 2500, teamSize: 16, business: '原创潮流玩具线上品牌', contact: '郑爽', phone: '13800010006' },
  { name: '极光储能', field: '新能源', foundedYear: 2021, city: '深圳', stage: 'A轮', fundingNeed: 4000, valuation: 35000, teamSize: 60, business: '工商业储能系统集成', contact: '冯凯', phone: '13800010007' },
  { name: '芯跃半导体', field: '硬件/芯片', foundedYear: 2020, city: '深圳', stage: 'B轮', fundingNeed: 5000, valuation: 60000, teamSize: 85, business: '车规级功率芯片设计', contact: '蒋涛', phone: '13800010008' },
  { name: '慧算账', field: '金融科技', foundedYear: 2022, city: '广州', stage: 'Pre-A', fundingNeed: 800, valuation: 6000, teamSize: 30, business: '中小企业智能记账与税务', contact: '许静', phone: '13800010009' },
  { name: '盾安风控', field: '金融科技', foundedYear: 2021, city: '广州', stage: 'A轮', fundingNeed: 1500, valuation: 11000, teamSize: 40, business: '反欺诈与信贷风控引擎', contact: '曹斌', phone: '13800010010' },
  { name: '深思智驾', field: '人工智能', foundedYear: 2021, city: '北京', stage: 'A轮', fundingNeed: 3000, valuation: 25000, teamSize: 55, business: '自动驾驶感知算法', contact: '丁宁', phone: '13800010011' },
  { name: '小语点读', field: '人工智能/教育', foundedYear: 2023, city: '北京', stage: '天使轮', fundingNeed: 350, valuation: 2200, teamSize: 10, business: '儿童AI口语陪练应用', contact: '袁泉', phone: '13800010012' },
  { name: '微创医械', field: '医疗健康', foundedYear: 2020, city: '上海', stage: 'B轮', fundingNeed: 4500, valuation: 40000, teamSize: 70, business: '微创手术机器人', contact: '顾然', phone: '13800010013' },
  { name: '绿源新材', field: '新能源', foundedYear: 2022, city: '深圳', stage: 'Pre-A', fundingNeed: 1000, valuation: 7000, teamSize: 25, business: '固态电池材料研发', contact: '韩雪', phone: '13800010014' },
  { name: '速派物流云', field: '企业服务', foundedYear: 2021, city: '广州', stage: 'A轮', fundingNeed: 2000, valuation: 15000, teamSize: 48, business: '智能仓配管理SaaS', contact: '薛松', phone: '13800010015' },
  { name: '味觉实验室', field: '消费/电商', foundedYear: 2023, city: '杭州', stage: '天使轮', fundingNeed: 250, valuation: 1800, teamSize: 14, business: '功能性健康零食品牌', contact: '范琳', phone: '13800010016' },
  { name: '链通供应链', field: '金融科技', foundedYear: 2021, city: '上海', stage: 'A轮', fundingNeed: 1800, valuation: 13000, teamSize: 38, business: '供应链金融数字化平台', contact: '任飞', phone: '13800010017' },
  { name: '睿芯传感', field: '硬件/芯片', foundedYear: 2022, city: '深圳', stage: 'Pre-A', fundingNeed: 1200, valuation: 9000, teamSize: 26, business: '工业级MEMS传感器', contact: '卢克', phone: '13800010018' },
  { name: '启航生物', field: '生物科技', foundedYear: 2023, city: '上海', stage: '天使轮', fundingNeed: 1300, valuation: 10000, teamSize: 15, business: '合成生物学原料生产', contact: '邱月', phone: '13800010019' },
  { name: '数擎云图', field: '企业服务', foundedYear: 2022, city: '北京', stage: 'Pre-A', fundingNeed: 900, valuation: 6500, teamSize: 24, business: '低代码数据可视化平台', contact: '武洋', phone: '13800010020' }
]

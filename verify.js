// verify.js
const Airtable = require('airtable');

// 配置Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
module.exports = async (req, res) => {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code required' });
  }

  try {
    // 在Airtable中查找该激活码
    const records = await base('activation_codes').select({
      filterByFormula: `{code} = "${code}"`
    }).firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Invalid code' });
    }

    const record = records[0];
    const used = record.get('used');

    if (used) {
      return res.status(400).json({ error: 'Code already used' });
    }

    // 标记为已使用
    await base('activation_codes').update(record.id, {
      used: true,
      used_at: new Date().toISOString()
    });

    // 返回成功
    res.status(200).json({ success: true, message: 'Activation successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
import type { Build, Component, QuoteData, QuoteItem, ReplacementRecord } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export function generateQuote(
  build: Build,
  components: Component[],
  clientName: string
): QuoteData {
  const items: QuoteItem[] = components.map((c) => ({
    category: CATEGORY_LABELS[c.category] ?? c.category,
    name: c.name,
    brand: c.brand,
    model: c.model,
    quantity: build.components.find((s) => s.componentId === c.id)?.quantity ?? 1,
    unitPrice: c.price,
    totalPrice: c.price * (build.components.find((s) => s.componentId === c.id)?.quantity ?? 1),
    warranty: '1年质保',
  }))

  const replacementHistory: ReplacementRecord[] = (build.replacementHistory ?? []).map((entry) => ({
    id: entry.id,
    slotId: entry.slotId,
    oldName: entry.oldComponentName,
    oldBrand: entry.oldComponentBrand,
    oldPrice: entry.oldPrice,
    newName: entry.newComponentName,
    newBrand: entry.newComponentBrand,
    newPrice: entry.newPrice,
    priceDiff: entry.priceDiff,
    reason: entry.reason === 'out_of_stock' ? '缺货替换' 
      : entry.reason === 'preference' ? '品牌偏好' 
      : entry.reason === 'upgrade' ? '性能升级' 
      : '其他',
    timestamp: entry.timestamp,
  }))

  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0)
  const taxRate = 0
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100
  const discountRate = 0
  const discountAmount = Math.round(subtotal * discountRate * 100) / 100
  const total = subtotal + taxAmount - discountAmount

  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const quoteNumber = 'QB' + today.getFullYear().toString().slice(2) + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return {
    buildId: build.id,
    buildName: build.name,
    clientName: clientName || '散客',
    date: dateStr,
    quoteNumber,
    items,
    replacementHistory,
    subtotal,
    taxRate,
    taxAmount,
    discountRate,
    discountAmount,
    total,
    warrantyInfo: '所有配件享受原厂质保，整机享受一年免费上门服务',
    notes: build.description || '感谢您的惠顾！本报价单有效期7天。价格如有变动以实际为准。',
  }
}

export function generateQuoteHtml(quote: QuoteData): string {
  const itemsHtml = quote.items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.category}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <div style="font-weight: 600;">${item.name}</div>
        <div style="font-size: 12px; color: #666;">${item.brand} ${item.model}</div>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">¥${item.unitPrice.toLocaleString()}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">¥${item.totalPrice.toLocaleString()}</td>
    </tr>
  `
    )
    .join('')

  const replacementHtml = quote.replacementHistory && quote.replacementHistory.length > 0
    ? `
  <div style="margin-top: 30px;">
    <h3 style="color: #1a1a2e; border-left: 4px solid #e63946; padding-left: 10px; margin-bottom: 15px;">配件变更记录</h3>
    <table style="font-size: 12px;">
      <thead>
        <tr>
          <th style="width: 60px; text-align: center;">序号</th>
          <th style="width: 100px;">槽位</th>
          <th>原配件</th>
          <th>替换为</th>
          <th style="width: 80px; text-align: right;">差价</th>
          <th style="width: 100px; text-align: center;">原因</th>
          <th style="width: 140px; text-align: center;">时间</th>
        </tr>
      </thead>
      <tbody>
        ${quote.replacementHistory.map((r, idx) => {
          const date = new Date(r.timestamp)
          const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
          const diffStr = r.priceDiff > 0 ? `+¥${r.priceDiff.toLocaleString()}` : r.priceDiff < 0 ? `-¥${Math.abs(r.priceDiff).toLocaleString()}` : '¥0'
          const diffColor = r.priceDiff > 0 ? '#e63946' : r.priceDiff < 0 ? '#2a9d8f' : '#666'
          return `
            <tr>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">${r.slotId}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">
                <div style="font-weight: 500;">${r.oldName}</div>
                <div style="font-size: 11px; color: #999;">${r.oldBrand} · ¥${r.oldPrice.toLocaleString()}</div>
              </td>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">
                <div style="font-weight: 500;">${r.newName}</div>
                <div style="font-size: 11px; color: #999;">${r.newBrand} · ¥${r.newPrice.toLocaleString()}</div>
              </td>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: ${diffColor};">${diffStr}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">${r.reason}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center; font-size: 11px; color: #999;">${timeStr}</td>
            </tr>
          `
        }).join('')}
      </tbody>
    </table>
  </div>
  ` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>报价单 - ${quote.quoteNumber}</title>
  <style>
    body { font-family: -apple-system, 'Microsoft YaHei', sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 20px; }
    .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #1a1a2e; }
    .subtitle { font-size: 14px; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
    .info-item { font-size: 14px; }
    .info-label { color: #666; display: inline-block; width: 80px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { background: #1a1a2e; color: #fff; padding: 10px 8px; text-align: left; }
    .summary { margin-top: 20px; text-align: right; }
    .summary-row { display: flex; justify-content: flex-end; padding: 5px 0; font-size: 14px; }
    .summary-label { width: 150px; color: #666; }
    .summary-value { width: 120px; text-align: right; }
    .summary-total { font-size: 18px; font-weight: bold; color: #e63946; padding: 10px 0; border-top: 2px solid #333; margin-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #999; font-size: 12px; color: #666; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
    .sign-line { border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 40px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">PC Builder Pro 电脑装机报价单</div>
    <div class="subtitle">专业装机服务 · 正品行货 · 品质保证</div>
  </div>

  <div class="info-grid">
    <div class="info-item"><span class="info-label">报价单号:</span>${quote.quoteNumber}</div>
    <div class="info-item"><span class="info-label">日期:</span>${quote.date}</div>
    <div class="info-item"><span class="info-label">客户名称:</span>${quote.clientName}</div>
    <div class="info-item"><span class="info-label">方案名称:</span>${quote.buildName}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">序号</th>
        <th style="width: 100px;">类别</th>
        <th>配件名称</th>
        <th style="width: 60px; text-align: center;">数量</th>
        <th style="width: 100px; text-align: right;">单价</th>
        <th style="width: 120px; text-align: right;">小计</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  ${replacementHtml}

  <div class="summary">
    <div class="summary-row">
      <span class="summary-label">商品小计:</span>
      <span class="summary-value">¥${quote.subtotal.toLocaleString()}</span>
    </div>
    ${quote.discountAmount > 0 ? `
    <div class="summary-row">
      <span class="summary-label">优惠折扣:</span>
      <span class="summary-value">-¥${quote.discountAmount.toLocaleString()}</span>
    </div>` : ''}
    <div class="summary-row summary-total">
      <span class="summary-label">应付总计:</span>
      <span class="summary-value">¥${quote.total.toLocaleString()}</span>
    </div>
    <div style="margin-top: 10px; font-size: 12px; color: #666;">
      大写金额：${numberToChinese(quote.total)}元整
    </div>
  </div>

  <div class="footer">
    <p><strong>质保说明：</strong>${quote.warrantyInfo}</p>
    <p><strong>备注：</strong>${quote.notes}</p>
  </div>

  <div class="signatures">
    <div>
      <div class="sign-line">客户签字：__________________</div>
      <div style="margin-top: 10px; font-size: 12px; color: #666;">日期：__________</div>
    </div>
    <div>
      <div class="sign-line">商家签字：__________________</div>
      <div style="margin-top: 10px; font-size: 12px; color: #666;">日期：__________</div>
    </div>
  </div>
</body>
</html>`
}

function numberToChinese(num: number): string {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿']
  let result = ''
  const str = Math.floor(num).toString()
  for (let i = 0; i < str.length; i++) {
    const digit = parseInt(str[i])
    const unitIndex = str.length - 1 - i
    if (digit !== 0) {
      result += digits[digit] + units[unitIndex]
    } else if (!result.endsWith('零') && i < str.length - 1) {
      result += '零'
    }
  }
  return result.replace(/零+$/, '') || '零'
}

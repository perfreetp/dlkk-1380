import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { generateQuoteHtml } from '@/utils/quote'
import { CATEGORY_LABELS } from '@/types'

function QuotePage() {
  const currentBuild = useAppStore((s) => s.getCurrentBuild())
  const quoteData = useAppStore((s) => s.quoteData)
  const generateQuote = useAppStore((s) => s.generateQuote)
  const setQuoteSettings = useAppStore((s) => s.setQuoteSettings)
  const getBuildTotalPrice = useAppStore((s) => s.getBuildTotalPrice)
  const getBuildComponents = useAppStore((s) => s.getBuildComponents)

  const [clientName, setClientName] = useState(currentBuild?.clientName ?? '')
  const [showPreview, setShowPreview] = useState(false)
  
  const quoteSettings = currentBuild?.quoteSettings ?? {
    discountRate: 0,
    taxRate: 0,
    installationFee: 0,
    deposit: 0,
  }
  
  const [discountRate, setDiscountRate] = useState(quoteSettings.discountRate.toString())
  const [taxRate, setTaxRate] = useState(quoteSettings.taxRate.toString())
  const [installationFee, setInstallationFee] = useState(quoteSettings.installationFee.toString())
  const [deposit, setDeposit] = useState(quoteSettings.deposit.toString())

  useEffect(() => {
    if (currentBuild?.quoteSettings) {
      setDiscountRate(currentBuild.quoteSettings.discountRate.toString())
      setTaxRate(currentBuild.quoteSettings.taxRate.toString())
      setInstallationFee(currentBuild.quoteSettings.installationFee.toString())
      setDeposit(currentBuild.quoteSettings.deposit.toString())
    }
  }, [currentBuild?.id])

  if (!currentBuild) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📄</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>请先选择一个装机方案</div>
        <div className="text-secondary">从左侧列表选择方案以生成报价单</div>
      </div>
    )
  }

  const buildComponents = getBuildComponents(currentBuild.id)
  const filled = buildComponents.filter((x) => x.component).length
  const totalPrice = getBuildTotalPrice(currentBuild.id)

  const parsedDiscountRate = parseFloat(discountRate) || 0
  const parsedTaxRate = parseFloat(taxRate) || 0
  const parsedInstallationFee = parseFloat(installationFee) || 0
  const parsedDeposit = parseFloat(deposit) || 0
  
  const discountAmount = Math.round(totalPrice * (parsedDiscountRate / 100) * 100) / 100
  const amountAfterDiscount = totalPrice - discountAmount + parsedInstallationFee
  const taxAmount = Math.round(amountAfterDiscount * (parsedTaxRate / 100) * 100) / 100
  const totalBeforeDeposit = amountAfterDiscount + taxAmount
  const finalTotal = totalBeforeDeposit
  const balanceDue = totalBeforeDeposit - parsedDeposit

  const handleGenerate = () => {
    const settings = {
      discountRate: parsedDiscountRate,
      taxRate: parsedTaxRate,
      installationFee: parsedInstallationFee,
      deposit: parsedDeposit,
    }
    generateQuote(currentBuild.id, clientName, settings)
  }

  const handleSettingsChange = () => {
    const settings = {
      discountRate: parsedDiscountRate,
      taxRate: parsedTaxRate,
      installationFee: parsedInstallationFee,
      deposit: parsedDeposit,
    }
    setQuoteSettings(currentBuild.id, settings)
    if (quoteData) {
      generateQuote(currentBuild.id, clientName, settings)
    }
  }

  const handlePrint = async () => {
    if (!quoteData) return
    const html = generateQuoteHtml(quoteData)

    if ((window as any).electron?.ipcRenderer) {
      await (window as any).electron.ipcRenderer.invoke('print-quote', html)
    } else {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 500)
      }
    }
  }

  const handleExportHtml = () => {
    if (!quoteData) return
    const html = generateQuoteHtml(quoteData)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `报价单_${quoteData.quoteNumber}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">报价单</h1>
          <div className="page-subtitle">
            方案：{currentBuild.name} · 已选 {filled}/11 个配件 · 总价 ¥{totalPrice.toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={filled === 0}
          >
            📄 生成报价单
          </button>
          {quoteData && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowPreview(!showPreview)}>
                👁️ {showPreview ? '隐藏' : '显示'}预览
              </button>
              <button className="btn btn-success" onClick={handlePrint}>
                🖨️ 打印
              </button>
              <button className="btn btn-secondary" onClick={handleExportHtml}>
                💾 导出 HTML
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ gridTemplateColumns: '320px 1fr' }}>
        <div>
          <div className="card">
            <div className="card-title">
              <span>⚙️</span> 报价单设置
            </div>
            <div className="form-group">
              <label className="label">客户名称</label>
              <input
                className="input"
                placeholder="请输入客户姓名或公司名称"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">方案名称</label>
              <input className="input" value={currentBuild.name} disabled />
            </div>

            <div className="form-group">
              <label className="label">折扣率 (%)</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                onBlur={handleSettingsChange}
              />
            </div>

            <div className="form-group">
              <label className="label">税率 (%)</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                onBlur={handleSettingsChange}
              />
            </div>

            <div className="form-group">
              <label className="label">人工装机费 (¥)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="10"
                value={installationFee}
                onChange={(e) => setInstallationFee(e.target.value)}
                onBlur={handleSettingsChange}
              />
            </div>

            <div className="form-group">
              <label className="label">已收定金 (¥)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="100"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                onBlur={handleSettingsChange}
              />
            </div>

            <div
              style={{
                padding: 12,
                background: 'var(--bg-darker)',
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                商品金额
              </div>
              <div className="price-large">¥{totalPrice.toLocaleString()}</div>
              
              <div style={{ marginTop: 12, fontSize: 13, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                {parsedDiscountRate > 0 && (
                  <div className="flex justify-between" style={{ padding: '3px 0' }}>
                    <span className="text-secondary">优惠折扣 ({parsedDiscountRate}%)：</span>
                    <span style={{ color: 'var(--success-color)' }}>-¥{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {parsedInstallationFee > 0 && (
                  <div className="flex justify-between" style={{ padding: '3px 0' }}>
                    <span className="text-secondary">装机服务费：</span>
                    <span>+¥{parsedInstallationFee.toLocaleString()}</span>
                  </div>
                )}
                {parsedTaxRate > 0 && (
                  <div className="flex justify-between" style={{ padding: '3px 0' }}>
                    <span className="text-secondary">税费 ({parsedTaxRate}%)：</span>
                    <span style={{ color: 'var(--danger-color)' }}>+¥{taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {parsedDeposit > 0 && (
                  <div className="flex justify-between" style={{ padding: '3px 0' }}>
                    <span className="text-secondary">已收定金：</span>
                    <span style={{ color: 'var(--success-color)' }}>-¥{parsedDeposit.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between" style={{ padding: '8px 0', borderTop: '1px solid var(--border-color)', marginTop: 6, fontWeight: 600 }}>
                  <span>应付总计：</span>
                  <span style={{ color: 'var(--primary-light)', fontSize: 16 }}>¥{finalTotal.toLocaleString()}</span>
                </div>
                {parsedDeposit > 0 && (
                  <div className="flex justify-between" style={{ padding: '3px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>尾款：</span>
                    <span>¥{balanceDue.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>💡</span> 使用说明
            </div>
            <ol style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.8 }}>
              <li>填写客户名称和报价设置</li>
              <li>点击"生成报价单"按钮</li>
              <li>预览确认无误后打印</li>
              <li>或导出为 HTML 发给客户</li>
              <li>修改设置后会自动更新报价</li>
            </ol>
          </div>
        </div>

        <div>
          {!quoteData ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <div style={{ fontSize: 16 }}>点击左侧"生成报价单"按钮创建报价</div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-title flex justify-between">
                <div>
                  <span>📋</span> 报价单 #{quoteData.quoteNumber}
                </div>
                <span className="text-muted">日期：{quoteData.date}</span>
              </div>

              {quoteData.riskSummary && (quoteData.riskSummary.lowStockItems.length > 0 || quoteData.riskSummary.replacementItems.length > 0) && (
                <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: '#ffc107', marginBottom: 8 }}>⚠️ 风险提示</div>
                  {quoteData.riskSummary.lowStockItems.length > 0 && (
                    <div style={{ fontSize: 13, marginBottom: 6 }}>
                      <strong>库存不足：</strong>
                      {quoteData.riskSummary.lowStockItems.map((item, i) => (
                        <span key={i} style={{ marginRight: 12 }}>
                          {item.name}（仅剩 {item.stock} 件）
                        </span>
                      ))}
                    </div>
                  )}
                  {quoteData.riskSummary.replacementItems.length > 0 && (
                    <div style={{ fontSize: 13 }}>
                      <strong>配件替换：</strong>
                      共 {quoteData.riskSummary.replacementItems.length} 项变更，
                      <span style={{ color: quoteData.riskSummary.totalPriceDiff > 0 ? 'var(--danger-color)' : quoteData.riskSummary.totalPriceDiff < 0 ? 'var(--success-color)' : 'inherit' }}>
                        {quoteData.riskSummary.totalPriceDiff > 0 ? `总价增加 +¥${quoteData.riskSummary.totalPriceDiff.toLocaleString()}` : quoteData.riskSummary.totalPriceDiff < 0 ? `总价减少 -¥${Math.abs(quoteData.riskSummary.totalPriceDiff).toLocaleString()}` : '总价无变化'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>序号</th>
                    <th>类别</th>
                    <th>配件名称</th>
                    <th style={{ width: 60, textAlign: 'center' }}>数量</th>
                    <th style={{ width: 100, textAlign: 'right' }}>单价</th>
                    <th style={{ width: 120, textAlign: 'right' }}>小计</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteData.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{i + 1}</td>
                      <td>
                        <span className="badge badge-default">{item.category}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {item.brand} · {item.model}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>¥{item.unitPrice.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ¥{item.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <div className="flex justify-between" style={{ padding: '6px 12px', maxWidth: 350, marginLeft: 'auto' }}>
                  <span className="text-secondary">商品小计：</span>
                  <span style={{ fontWeight: 600 }}>¥{quoteData.subtotal.toLocaleString()}</span>
                </div>
                {quoteData.installationFee > 0 && (
                  <div className="flex justify-between" style={{ padding: '6px 12px', maxWidth: 350, marginLeft: 'auto' }}>
                    <span className="text-secondary">装机服务费：</span>
                    <span style={{ fontWeight: 600 }}>+¥{quoteData.installationFee.toLocaleString()}</span>
                  </div>
                )}
                {quoteData.discountAmount > 0 && (
                  <div className="flex justify-between" style={{ padding: '6px 12px', maxWidth: 350, marginLeft: 'auto' }}>
                    <span className="text-secondary">优惠折扣 ({quoteData.discountRate}%)：</span>
                    <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>-¥{quoteData.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {quoteData.taxAmount > 0 && (
                  <div className="flex justify-between" style={{ padding: '6px 12px', maxWidth: 350, marginLeft: 'auto' }}>
                    <span className="text-secondary">税费 ({quoteData.taxRate}%)：</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger-color)' }}>+¥{quoteData.taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {quoteData.deposit > 0 && (
                  <div className="flex justify-between" style={{ padding: '6px 12px', maxWidth: 350, marginLeft: 'auto' }}>
                    <span className="text-secondary">已收定金：</span>
                    <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>-¥{quoteData.deposit.toLocaleString()}</span>
                  </div>
                )}
                <div
                  className="flex justify-between"
                  style={{ padding: '12px', borderTop: '2px solid var(--border)', maxWidth: 350, marginLeft: 'auto', marginTop: 8 }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600 }}>应付总计：</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-light)' }}>
                    ¥{quoteData.total.toLocaleString()}
                  </span>
                </div>
                {quoteData.deposit > 0 && (
                  <div className="flex justify-between" style={{ padding: '4px 12px', maxWidth: 350, marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>尾款：</span>
                    <span>¥{quoteData.balanceDue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {quoteData.replacementHistory && quoteData.replacementHistory.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div className="card-title">
                    <span>📝</span> 配件变更记录 ({quoteData.replacementHistory.length} 条)
                  </div>
                  <table className="table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>序号</th>
                        <th>槽位</th>
                        <th>原配件</th>
                        <th>替换为</th>
                        <th style={{ width: 80, textAlign: 'right' }}>差价</th>
                        <th style={{ width: 80, textAlign: 'center' }}>原因</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteData.replacementHistory.map((r, i) => {
                        const diffStr = r.priceDiff > 0 ? `+¥${r.priceDiff.toLocaleString()}` : r.priceDiff < 0 ? `-¥${Math.abs(r.priceDiff).toLocaleString()}` : '¥0'
                        const diffColor = r.priceDiff > 0 ? 'var(--danger-color)' : r.priceDiff < 0 ? 'var(--success-color)' : 'inherit'
                        return (
                          <tr key={i}>
                            <td style={{ textAlign: 'center' }}>{i + 1}</td>
                            <td>{r.slotId}</td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{r.oldName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.oldBrand} · ¥{r.oldPrice.toLocaleString()}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{r.newName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.newBrand} · ¥{r.newPrice.toLocaleString()}</div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: diffColor }}>{diffStr}</td>
                            <td style={{ textAlign: 'center' }}>{r.reason}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {showPreview && (
                <div style={{ marginTop: 20 }}>
                  <div className="card-title">
                    <span>👁️</span> 打印预览
                  </div>
                  <div
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 0,
                      background: 'white',
                      overflow: 'hidden',
                    }}
                  >
                    <iframe
                      srcDoc={generateQuoteHtml(quoteData)}
                      style={{ width: '100%', height: 600, border: 'none' }}
                      title="报价单预览"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuotePage

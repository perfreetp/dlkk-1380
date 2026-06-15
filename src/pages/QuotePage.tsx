import { useState } from 'react'
import { useAppStore } from '@/store'
import { generateQuoteHtml } from '@/utils/quote'

function QuotePage() {
  const currentBuild = useAppStore((s) => s.getCurrentBuild())
  const quoteData = useAppStore((s) => s.quoteData)
  const generateQuote = useAppStore((s) => s.generateQuote)
  const getBuildTotalPrice = useAppStore((s) => s.getBuildTotalPrice)
  const getBuildComponents = useAppStore((s) => s.getBuildComponents)

  const [clientName, setClientName] = useState(currentBuild?.clientName ?? '')
  const [showPreview, setShowPreview] = useState(false)

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

  const handleGenerate = () => {
    generateQuote(currentBuild.id, clientName)
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
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>💡</span> 使用说明
            </div>
            <ol style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.8 }}>
              <li>填写客户名称</li>
              <li>点击"生成报价单"按钮</li>
              <li>预览确认无误后打印</li>
              <li>或导出为 HTML 发给客户</li>
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
                <div className="flex justify-between" style={{ padding: '6px 12px', maxWidth: 300, marginLeft: 'auto' }}>
                  <span className="text-secondary">商品小计：</span>
                  <span style={{ fontWeight: 600 }}>¥{quoteData.subtotal.toLocaleString()}</span>
                </div>
                <div
                  className="flex justify-between"
                  style={{ padding: '12px', borderTop: '2px solid var(--border)', maxWidth: 300, marginLeft: 'auto', marginTop: 8 }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600 }}>应付总计：</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-light)' }}>
                    ¥{quoteData.total.toLocaleString()}
                  </span>
                </div>
              </div>

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

import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const api = new Hono<{ Bindings: Bindings }>()

// Enable CORS for all API routes
api.use('/*', cors())

// ============================================================================
// SERVICES API
// ============================================================================

// GET all services
api.get('/services', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM services ORDER BY name
    `).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// GET single service with daily data
api.get('/services/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get service
    const service = await c.env.DB.prepare(`
      SELECT * FROM services WHERE id = ?
    `).bind(id).first()
    
    if (!service) {
      return c.json({ success: false, error: 'Service not found' }, 404)
    }
    
    // Get daily data
    const { results: dailyData } = await c.env.DB.prepare(`
      SELECT * FROM daily_data WHERE service_id = ? ORDER BY date
    `).bind(id).all()
    
    return c.json({ 
      success: true, 
      data: { ...service, dailyData } 
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST create new service
api.post('/services', async (c) => {
  try {
    const body = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO services (
        name, category, account, country, service_version, service_sku,
        currency, zar_rate, mtd_revenue, mtd_target, actual_run_rate,
        required_run_rate, subscriber_base, mtd_net_additions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.name,
      body.category,
      body.account,
      body.country,
      body.serviceVersion,
      body.serviceSKU,
      body.currency,
      body.zarRate,
      body.mtdRevenue || 0,
      body.mtdTarget || 0,
      body.actualRunRate || 0,
      body.requiredRunRate,
      body.subscriberBase || 0,
      body.mtdNetAdditions || 0
    ).run()
    
    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body } 
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// PUT update service
api.put('/services/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE services SET
        name = ?, category = ?, account = ?, country = ?,
        service_version = ?, service_sku = ?, currency = ?, zar_rate = ?,
        mtd_revenue = ?, mtd_target = ?, actual_run_rate = ?,
        required_run_rate = ?, subscriber_base = ?, mtd_net_additions = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name,
      body.category,
      body.account,
      body.country,
      body.serviceVersion,
      body.serviceSKU,
      body.currency,
      body.zarRate,
      body.mtdRevenue,
      body.mtdTarget,
      body.actualRunRate,
      body.requiredRunRate,
      body.subscriberBase,
      body.mtdNetAdditions,
      id
    ).run()
    
    return c.json({ success: true, data: { id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// DELETE service
api.delete('/services/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare(`
      DELETE FROM services WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// DAILY DATA API
// ============================================================================

// POST create daily data
api.post('/daily-data', async (c) => {
  try {
    const body = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT OR REPLACE INTO daily_data (
        service_id, day, date, business_category, account, country,
        service_version, currency, zar_rate, service_sku, daily_billing_lcu,
        revenue, target, churned_subs, daily_acquisitions, net_additions,
        subscriber_base
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.serviceId,
      body.day,
      body.date,
      body.businessCategory,
      body.account,
      body.country,
      body.serviceVersion,
      body.currency,
      body.zarRate,
      body.serviceSKU,
      body.dailyBillingLCU,
      body.revenue,
      body.target,
      body.churnedSubs,
      body.dailyAcquisitions,
      body.netAdditions,
      body.subscriberBase
    ).run()
    
    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body } 
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// PUT update daily data
api.put('/daily-data/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE daily_data SET
        daily_billing_lcu = ?, revenue = ?, target = ?,
        churned_subs = ?, daily_acquisitions = ?, net_additions = ?,
        subscriber_base = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.dailyBillingLCU,
      body.revenue,
      body.target,
      body.churnedSubs,
      body.dailyAcquisitions,
      body.netAdditions,
      body.subscriberBase,
      id
    ).run()
    
    return c.json({ success: true, data: { id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST bulk upsert daily data
api.post('/daily-data/bulk', async (c) => {
  try {
    const { data } = await c.req.json()
    
    // Use transaction for bulk insert
    const statements = data.map((item: any) => 
      c.env.DB.prepare(`
        INSERT OR REPLACE INTO daily_data (
          service_id, day, date, business_category, account, country,
          service_version, currency, zar_rate, service_sku, daily_billing_lcu,
          revenue, target, churned_subs, daily_acquisitions, net_additions,
          subscriber_base
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        item.serviceId,
        item.day,
        item.date,
        item.businessCategory,
        item.account,
        item.country,
        item.serviceVersion,
        item.currency,
        item.zarRate,
        item.serviceSKU,
        item.dailyBillingLCU,
        item.revenue,
        item.target,
        item.churnedSubs,
        item.dailyAcquisitions,
        item.netAdditions,
        item.subscriberBase
      )
    )
    
    await c.env.DB.batch(statements)
    
    return c.json({ success: true, count: data.length })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// MIGRATION API - Import from localStorage
// ============================================================================

// POST migrate data from localStorage format
api.post('/migrate', async (c) => {
  try {
    const { services } = await c.req.json()
    
    for (const service of services) {
      // Insert service
      const serviceResult = await c.env.DB.prepare(`
        INSERT INTO services (
          name, category, account, country, service_version, service_sku,
          currency, zar_rate, mtd_revenue, mtd_target, actual_run_rate,
          required_run_rate, subscriber_base, mtd_net_additions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        service.name,
        service.category,
        service.account,
        service.country,
        service.serviceVersion,
        service.serviceSKU,
        service.currency,
        service.zarRate,
        service.mtdRevenue || 0,
        service.mtdTarget || 0,
        service.actualRunRate || 0,
        service.requiredRunRate,
        service.subscriberBase || 0,
        service.mtdNetAdditions || 0
      ).run()
      
      const serviceId = serviceResult.meta.last_row_id
      
      // Insert daily data
      if (service.dailyData && service.dailyData.length > 0) {
        const statements = service.dailyData.map((day: any) =>
          c.env.DB.prepare(`
            INSERT INTO daily_data (
              service_id, day, date, business_category, account, country,
              service_version, currency, zar_rate, service_sku, daily_billing_lcu,
              revenue, target, churned_subs, daily_acquisitions, net_additions,
              subscriber_base
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            serviceId,
            day.day,
            day.date,
            day.businessCategory,
            day.account,
            day.country,
            day.serviceVersion,
            day.currency,
            day.zarRate,
            day.serviceSKU,
            day.dailyBillingLCU || 0,
            day.revenue || 0,
            day.target || 0,
            day.churnedSubs || 0,
            day.dailyAcquisitions || 0,
            day.netAdditions || 0,
            day.subscriberBase || 0
          )
        )
        
        await c.env.DB.batch(statements)
      }
    }
    
    return c.json({ success: true, message: 'Migration completed' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default api

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
      // Check if service already exists (by unique key: name + service_version + service_sku + currency)
      const existingService = await c.env.DB.prepare(`
        SELECT id FROM services 
        WHERE name = ? AND service_version = ? AND service_sku = ? AND currency = ?
      `).bind(
        service.name,
        service.serviceVersion,
        service.serviceSKU,
        service.currency
      ).first()
      
      let serviceId: number
      
      if (existingService) {
        // UPDATE existing service
        serviceId = existingService.id as number
        await c.env.DB.prepare(`
          UPDATE services SET
            category = ?,
            account = ?,
            country = ?,
            zar_rate = ?,
            required_run_rate = ?,
            subscriber_base = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          service.category,
          service.account,
          service.country,
          service.zarRate,
          service.requiredRunRate,
          service.subscriberBase || 0,
          serviceId
        ).run()
      } else {
        // INSERT new service
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
        
        serviceId = serviceResult.meta.last_row_id as number
      }
      
      // Insert or replace daily data (handles both new days and updates to existing days)
      if (service.dailyData && service.dailyData.length > 0) {
        const statements = service.dailyData.map((day: any) =>
          c.env.DB.prepare(`
            INSERT OR REPLACE INTO daily_data (
              service_id, day, date, business_category, account, country,
              service_version, currency, zar_rate, service_sku, daily_billing_lcu,
              revenue, target, churned_subs, daily_acquisitions, net_additions,
              subscriber_base, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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

// ============================================================================
// USERS API
// ============================================================================

// GET all users
api.get('/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, username, password, type, created_at, updated_at FROM users ORDER BY username
    `).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST create user
api.post('/users', async (c) => {
  try {
    const body = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, password, type) VALUES (?, ?, ?)
    `).bind(body.username, body.password, body.type).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// PUT update user
api.put('/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE users SET password = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(body.password, body.type, id).run()
    
    return c.json({ success: true, data: { id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// DELETE user
api.delete('/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// MASTERY API
// ============================================================================

// GET all mastery data
api.get('/mastery', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM mastery_data ORDER BY category, skill_name
    `).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST create mastery item
api.post('/mastery', async (c) => {
  try {
    const body = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO mastery_data (skill_name, category, current_level, target_level, progress_percentage, last_practice_date, notes, username, initiated, concluded, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.skillName,
      body.category,
      body.currentLevel || 0,
      body.targetLevel || 5,
      body.progressPercentage || 0,
      body.lastPracticeDate || null,
      body.notes || null,
      body.username || null,
      body.initiated || null,
      body.concluded || null,
      body.createdBy || null
    ).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// PUT update mastery item
api.put('/mastery/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE mastery_data SET
        skill_name = ?, category = ?, current_level = ?, target_level = ?,
        progress_percentage = ?, last_practice_date = ?, notes = ?,
        username = ?, initiated = ?, concluded = ?, created_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.skillName,
      body.category,
      body.currentLevel,
      body.targetLevel,
      body.progressPercentage,
      body.lastPracticeDate,
      body.notes,
      body.username,
      body.initiated,
      body.concluded,
      body.createdBy,
      id
    ).run()
    
    return c.json({ success: true, data: { id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// DELETE mastery item
api.delete('/mastery/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM mastery_data WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// COURSES API
// ============================================================================

// GET all courses
api.get('/courses', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM courses ORDER BY category, title
    `).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST create course
api.post('/courses', async (c) => {
  try {
    const body = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO courses (title, provider, category, difficulty, duration, url, description, tags, status, completion_date, rating, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.title,
      body.provider || null,
      body.category || null,
      body.difficulty || null,
      body.duration || null,
      body.url || null,
      body.description || null,
      body.tags ? JSON.stringify(body.tags) : null,
      body.status || 'Not Started',
      body.completionDate || null,
      body.rating || null,
      body.notes || null
    ).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// PUT update course
api.put('/courses/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE courses SET
        title = ?, provider = ?, category = ?, difficulty = ?, duration = ?,
        url = ?, description = ?, tags = ?, status = ?, completion_date = ?,
        rating = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.title,
      body.provider,
      body.category,
      body.difficulty,
      body.duration,
      body.url,
      body.description,
      body.tags ? JSON.stringify(body.tags) : null,
      body.status,
      body.completionDate,
      body.rating,
      body.notes,
      id
    ).run()
    
    return c.json({ success: true, data: { id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// DELETE course
api.delete('/courses/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM courses WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// KANBAN API
// ============================================================================

// GET all kanban cards
api.get('/kanban', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM kanban_cards ORDER BY created_at DESC
    `).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// POST create kanban card
api.post('/kanban', async (c) => {
  try {
    const body = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO kanban_cards (
        card_id, title, description, category, priority, status, 
        assigned_to, due_date, tags, capability, owner, start_date, 
        target_date, lane, comments
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.id,
      body.title,
      body.description || null,
      body.category || null,
      body.priority || 'Medium',
      body.status || 'Planned',
      body.assignedTo || null,
      body.dueDate || null,
      body.tags ? JSON.stringify(body.tags) : null,
      body.capability || null,
      body.owner || null,
      body.startDate || null,
      body.targetDate || null,
      body.lane || 'Planned',
      body.comments || null
    ).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id, ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// PUT update kanban card
api.put('/kanban/:cardId', async (c) => {
  try {
    const cardId = c.req.param('cardId')
    const body = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE kanban_cards SET
        title = ?, description = ?, category = ?, priority = ?, status = ?,
        assigned_to = ?, due_date = ?, tags = ?, capability = ?, owner = ?,
        start_date = ?, target_date = ?, lane = ?, comments = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE card_id = ?
    `).bind(
      body.title,
      body.description,
      body.category,
      body.priority,
      body.status,
      body.assignedTo,
      body.dueDate,
      body.tags ? JSON.stringify(body.tags) : null,
      body.capability,
      body.owner,
      body.startDate,
      body.targetDate,
      body.lane,
      body.comments,
      cardId
    ).run()
    
    return c.json({ success: true, data: { ...body } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// DELETE kanban card
api.delete('/kanban/:cardId', async (c) => {
  try {
    const cardId = c.req.param('cardId')
    await c.env.DB.prepare(`DELETE FROM kanban_cards WHERE card_id = ?`).bind(cardId).run()
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default api

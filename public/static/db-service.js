// Database Service - Handles all API calls to Cloudflare D1
const DBService = {
    baseUrl: '/api',
    
    // Services API
    async getAllServices() {
        try {
            const response = await fetch(`${this.baseUrl}/services`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to fetch services');
        } catch (error) {
            console.error('getAllServices error:', error);
            return [];
        }
    },
    
    async getService(id) {
        try {
            const response = await fetch(`${this.baseUrl}/services/${id}`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to fetch service');
        } catch (error) {
            console.error('getService error:', error);
            return null;
        }
    },
    
    async createService(serviceData) {
        try {
            const response = await fetch(`${this.baseUrl}/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to create service');
        } catch (error) {
            console.error('createService error:', error);
            throw error;
        }
    },
    
    async updateService(id, serviceData) {
        try {
            const response = await fetch(`${this.baseUrl}/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to update service');
        } catch (error) {
            console.error('updateService error:', error);
            throw error;
        }
    },
    
    async deleteService(id) {
        try {
            const response = await fetch(`${this.baseUrl}/services/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                return true;
            }
            throw new Error(result.error || 'Failed to delete service');
        } catch (error) {
            console.error('deleteService error:', error);
            throw error;
        }
    },
    
    // Daily Data API
    async createDailyData(dailyData) {
        try {
            const response = await fetch(`${this.baseUrl}/daily-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dailyData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to create daily data');
        } catch (error) {
            console.error('createDailyData error:', error);
            throw error;
        }
    },
    
    async updateDailyData(id, dailyData) {
        try {
            const response = await fetch(`${this.baseUrl}/daily-data/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dailyData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to update daily data');
        } catch (error) {
            console.error('updateDailyData error:', error);
            throw error;
        }
    },
    
    async bulkUpsertDailyData(dataArray) {
        try {
            const response = await fetch(`${this.baseUrl}/daily-data/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: dataArray })
            });
            const result = await response.json();
            if (result.success) {
                return result.count;
            }
            throw new Error(result.error || 'Failed to bulk upsert daily data');
        } catch (error) {
            console.error('bulkUpsertDailyData error:', error);
            throw error;
        }
    },
    
    // Convert frontend format to API format
    formatServiceForAPI(service) {
        return {
            name: service.name,
            category: service.category,
            account: service.account,
            country: service.country,
            serviceVersion: service.serviceVersion,
            serviceSKU: service.serviceSKU,
            currency: service.currency,
            zarRate: service.zarRate,
            mtdRevenue: service.mtdRevenue || 0,
            mtdTarget: service.mtdTarget || 0,
            actualRunRate: service.actualRunRate || 0,
            requiredRunRate: service.requiredRunRate,
            subscriberBase: service.subscriberBase || 0,
            mtdNetAdditions: service.mtdNetAdditions || 0
        };
    },
    
    formatDailyDataForAPI(dailyData, serviceId) {
        return {
            serviceId: serviceId,
            day: dailyData.day,
            date: dailyData.date,
            businessCategory: dailyData.businessCategory,
            account: dailyData.account,
            country: dailyData.country,
            serviceVersion: dailyData.serviceVersion,
            currency: dailyData.currency,
            zarRate: dailyData.zarRate,
            serviceSKU: dailyData.serviceSKU,
            dailyBillingLCU: dailyData.dailyBillingLCU || 0,
            revenue: dailyData.revenue || 0,
            target: dailyData.target || 0,
            churnedSubs: dailyData.churnedSubs || 0,
            dailyAcquisitions: dailyData.dailyAcquisitions || 0,
            netAdditions: dailyData.netAdditions || 0,
            subscriberBase: dailyData.subscriberBase || 0
        };
    },
    
    // ============================================================================
    // USERS API
    // ============================================================================
    async getAllUsers() {
        try {
            const response = await fetch(`${this.baseUrl}/users`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to fetch users');
        } catch (error) {
            console.error('getAllUsers error:', error);
            return [];
        }
    },
    
    async createUser(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to create user');
        } catch (error) {
            console.error('createUser error:', error);
            throw error;
        }
    },
    
    async updateUser(id, userData) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to update user');
        } catch (error) {
            console.error('updateUser error:', error);
            throw error;
        }
    },
    
    async deleteUser(id) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                return true;
            }
            throw new Error(result.error || 'Failed to delete user');
        } catch (error) {
            console.error('deleteUser error:', error);
            throw error;
        }
    },
    
    // ============================================================================
    // MASTERY API
    // ============================================================================
    async getAllMastery() {
        try {
            const response = await fetch(`${this.baseUrl}/mastery`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to fetch mastery data');
        } catch (error) {
            console.error('getAllMastery error:', error);
            return [];
        }
    },
    
    async createMastery(masteryData) {
        try {
            const response = await fetch(`${this.baseUrl}/mastery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(masteryData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to create mastery item');
        } catch (error) {
            console.error('createMastery error:', error);
            throw error;
        }
    },
    
    async updateMastery(id, masteryData) {
        try {
            const response = await fetch(`${this.baseUrl}/mastery/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(masteryData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to update mastery item');
        } catch (error) {
            console.error('updateMastery error:', error);
            throw error;
        }
    },
    
    async deleteMastery(id) {
        try {
            const response = await fetch(`${this.baseUrl}/mastery/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                return true;
            }
            throw new Error(result.error || 'Failed to delete mastery item');
        } catch (error) {
            console.error('deleteMastery error:', error);
            throw error;
        }
    },
    
    // ============================================================================
    // COURSES API
    // ============================================================================
    async getAllCourses() {
        try {
            const response = await fetch(`${this.baseUrl}/courses`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to fetch courses');
        } catch (error) {
            console.error('getAllCourses error:', error);
            return [];
        }
    },
    
    async createCourse(courseData) {
        try {
            const response = await fetch(`${this.baseUrl}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to create course');
        } catch (error) {
            console.error('createCourse error:', error);
            throw error;
        }
    },
    
    async updateCourse(id, courseData) {
        try {
            const response = await fetch(`${this.baseUrl}/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to update course');
        } catch (error) {
            console.error('updateCourse error:', error);
            throw error;
        }
    },
    
    async deleteCourse(id) {
        try {
            const response = await fetch(`${this.baseUrl}/courses/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                return true;
            }
            throw new Error(result.error || 'Failed to delete course');
        } catch (error) {
            console.error('deleteCourse error:', error);
            throw error;
        }
    },
    
    // ============================================================================
    // KANBAN API
    // ============================================================================
    async getAllKanban() {
        try {
            const response = await fetch(`${this.baseUrl}/kanban`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to fetch kanban cards');
        } catch (error) {
            console.error('getAllKanban error:', error);
            return [];
        }
    },
    
    async createKanban(kanbanData) {
        try {
            const response = await fetch(`${this.baseUrl}/kanban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kanbanData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to create kanban card');
        } catch (error) {
            console.error('createKanban error:', error);
            throw error;
        }
    },
    
    async updateKanban(cardId, kanbanData) {
        try {
            const response = await fetch(`${this.baseUrl}/kanban/${cardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kanbanData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error || 'Failed to update kanban card');
        } catch (error) {
            console.error('updateKanban error:', error);
            throw error;
        }
    },
    
    async deleteKanban(cardId) {
        try {
            const response = await fetch(`${this.baseUrl}/kanban/${cardId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                return true;
            }
            throw new Error(result.error || 'Failed to delete kanban card');
        } catch (error) {
            console.error('deleteKanban error:', error);
            throw error;
        }
    }
};

const API_BASE_URL = import.meta.env.API_URL || 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('sevasaathi_token');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('API endpoint not found. Please check your backend URL configuration.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (error.message.includes('API endpoint not found')) {
        throw error;
      }
      throw new Error('Failed to connect to server. Please try again.');
    }
  }

  // Auth
  async login(phone, pin, role) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, pin, role }),
    });
    
    if (data.token) {
      localStorage.setItem('sevasaathi_token', data.token);
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.token) {
      localStorage.setItem('sevasaathi_token', data.token);
    }
    
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    localStorage.removeItem('sevasaathi_token');
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Services
  async getServices() {
    return this.request('/services');
  }

  async getService(id) {
    return this.request(`/services/${id}`);
  }

  // Workers
  async getWorkers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/workers?${queryString}`);
  }

  async getWorker(id) {
    return this.request(`/workers/${id}`);
  }

  async updateWorker(id, data) {
    return this.request(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleWorkerAvailability(id) {
    return this.request(`/workers/${id}/availability`, {
      method: 'PATCH',
    });
  }

  async getWorkerBookings(id) {
    return this.request(`/workers/${id}/bookings`);
  }

  // Customers
  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  async updateCustomer(id, data) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async saveWorker(customerId, workerId, action) {
    return this.request(`/customers/${customerId}/saved-workers`, {
      method: 'POST',
      body: JSON.stringify({ workerId, action }),
    });
  }

  async getCustomerBookings(id) {
    return this.request(`/customers/${id}/bookings`);
  }

  // Bookings
  async createBooking(data) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  async acceptBooking(id) {
    return this.request(`/bookings/${id}/accept`, {
      method: 'PATCH',
    });
  }

  async updateBookingStatus(id, status) {
    return this.request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async verifyArrivalOTP(id, otp) {
    return this.request(`/bookings/${id}/verify-arrival`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async verifyCompletionOTP(id, otp, amount) {
    return this.request(`/bookings/${id}/verify-completion`, {
      method: 'POST',
      body: JSON.stringify({ otp, amount }),
    });
  }

  async cancelBooking(id, reason) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async addBookingReview(id, rating, review) {
    return this.request(`/bookings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  }

  // Reviews
  async getWorkerReviews(workerId) {
    return this.request(`/reviews/worker/${workerId}`);
  }

  async getCustomerReviews(customerId) {
    return this.request(`/reviews/customer/${customerId}`);
  }

  // Wallet
  async getWalletBalance() {
    return this.request('/wallets/balance');
  }

  async getWalletTransactions() {
    return this.request('/wallets/transactions');
  }

  async creditWallet(amount, description, bookingId) {
    return this.request('/wallets/credit', {
      method: 'POST',
      body: JSON.stringify({ amount, description, bookingId }),
    });
  }

  async withdrawWallet(amount, description) {
    return this.request('/wallets/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  // Admin
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminWorkers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/workers?${queryString}`);
  }

  async approveWorker(id) {
    return this.request(`/admin/workers/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async suspendWorker(id, reason) {
    return this.request(`/admin/workers/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getAdminActivity() {
    return this.request('/admin/activity');
  }

  // Disputes
  async createDispute(bookingId, issue) {
    return this.request('/disputes', {
      method: 'POST',
      body: JSON.stringify({ bookingId, issue }),
    });
  }

  async getDisputes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/disputes?${queryString}`);
  }

  async getDispute(id) {
    return this.request(`/disputes/${id}`);
  }

  async updateDisputeStatus(id, status, resolution, refundAmount) {
    return this.request(`/disputes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution, refundAmount }),
    });
  }

  // Jobs (KaamConnect features)
  async createJob(data) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getJob(id) {
    return this.request(`/jobs/${id}`);
  }

  async getJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/jobs?${queryString}`);
  }

  async acceptJob(jobId, amount, message) {
    return this.request(`/jobs/${jobId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ amount, message }),
    });
  }

  async negotiateJob(jobId, amount, message) {
    return this.request(`/jobs/${jobId}/negotiate`, {
      method: 'POST',
      body: JSON.stringify({ amount, message }),
    });
  }

  async acceptOffer(jobId, negotiationId) {
    return this.request(`/jobs/${jobId}/accept-offer`, {
      method: 'POST',
      body: JSON.stringify({ negotiationId }),
    });
  }

  async getKaamScore(workerId) {
    return this.request(`/jobs/${workerId}/kaamscore`);
  }

  // Fair Price Engine
  async calculateFairPrice(serviceType, city, urgency, description) {
    return this.request('/jobs/fair-price', {
      method: 'POST',
      body: JSON.stringify({ serviceType, city, urgency, description }),
    });
  }
}

export const api = new ApiService();

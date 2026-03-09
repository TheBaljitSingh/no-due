import api from "./api";
export const getCustomers = async ({
  page = 1,
  limit = 100,
  search = "",
} = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search && search.trim() !== "") params.append("search", search.trim());
  const response = await api.get(`/v1/customers?${params.toString()}`);
  return response.data ?? [];
};

export const createCustomers = async (formData) => {
  console.log("submitting the data:", formData);
  const response = await api.post(`/v1/customers`, formData);
  return response.data;
};

export const deleteCustomers = async (ids) => {
  const response = await api.delete(`/v1/customers`, { data: ids });
  return response.data;
};

export const getAllcustomers = async () => {
  const response = await api.get(`/v1/customers?limit=all`);
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await api.get(`/v1/customers/${id}`);
  return response.data;
};

export const addDueToCustomer = async (customerId, data) => {
  const response = await api.post(`/v1/customers/${customerId}/add-due`, data);
  return response.data;
};

export const addPaymentForCustomer = async (customerId, data) => {
  const response = await api.post(
    `/v1/customers/${customerId}/add-payment`,
    data,
  );
  return response.data;
};

export const editCustomerDue = async (customerId, data) => {
  const response = await api.post(`/v1/customers/${customerId}/edit-due`, data);
  return response.data;
};

export const getCustomerTransactions = async (customerId) => {
  const response = await api.get(`/v1/customers/${customerId}/transactions`);
  return response.data ?? [];
};

export const updatecustomer = async (id, updatedData) => {
  console.log(id, updatedData);
  const response = await api.put(`/v1/customers/${id}`, updatedData);
  return response.data;
};

export const updateCustomersBatch = async (batchData) => {
  const response = await api.put(`/v1/customers/bulk`, batchData);
  return response.data;
};


/**
 * Dry-run validation — zero DB writes.
 * Returns { valid: bool, errors: [{row, field, value, message}] }
 */
export const validateBulkCustomers = async (data) => {
  const response = await api.post(`/v1/customers/validate-bulk`, data);
  return response.data;
};

/**
 * Two-phase SSE bulk upload.
 * Since EventSource only supports GET, we use fetch with a streaming ReadableStream reader.
 * @param {Array} data - parsed customer rows
 * @param {function} onEvent - called with each parsed SSE event object
 */
export const bulkUploadSSE = async (data, onEvent) => {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const baseURL = isLocal
    ? "http://localhost:3001/api"
    : `${import.meta.env.VITE_API_BASE_URL}/api`;

  const response = await fetch(`${baseURL}/v1/customers/bulk-upload-sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // sends session cookie
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE lines look like: "data: {...}\n\n"
    const parts = buffer.split("\n\n");
    buffer = parts.pop(); // keep incomplete chunk
    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          onEvent(event);
        } catch (_) {
          /* malformed line, skip */
        }
      }
    }
  }
};

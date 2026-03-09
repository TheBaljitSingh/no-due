import api from "./api";

export const registerUser = async (userData) => {
        const response = await api.post('/v1/user', userData);
        return response.data;
};

export const updateUser = async (updatedData) => {
        const response = await api.put('/v1/user', updatedData);
        return response.data;
};

export const updatePassword = async (passwordData) => {
        const response = await api.put('/v1/user/password', passwordData);
        return response.data;
};

export const getDueTransactionsSummary = async ({
        page = 1, limit = 10, query = "",
        statuses = [], overdue = "any",
        minAmt = "", maxAmt = "",
        from = "", to = ""
}) => {
        const params = new URLSearchParams({ page, limit, query });
        if (statuses.length) params.append("statuses", statuses.join(","));
        if (overdue && overdue !== "any") params.append("overdue", overdue);
        if (minAmt) params.append("minAmt", minAmt);
        if (maxAmt) params.append("maxAmt", maxAmt);
        if (from) params.append("from", from);
        if (to) params.append("to", to);

        const response = await api.get(`/v1/user/all-transactions?${params.toString()}`);
        return response.data;
};

class AirTableDataService {
  constructor(axiosInstance) {
    this.apiService = axiosInstance;
  }

  /**
   * Get all bases (projects)
   * @returns {Promise<Array>} List of bases
   */
  async getBases() {
    const response = await this.apiService.client.get("/meta/bases");
    return response?.data;
  }

  /**
   * Get all tables for a specific base
   * @param {string} baseId - The ID of the base
   * @returns {Promise<Array>} List of tables
   */
  async getTables(baseId) {
    if (!baseId) throw new Error("Base ID is required");

    console.log("Fetching tables for base", baseId);
    const response = await this.apiService.client.get(
      `/meta/bases/${baseId}/tables`
    );
    return response?.data?.tables || [];
  }

  /**
   * Get records (tickets/pages) from a table
   * @param {string} baseId - The ID of the base
   * @param {string} tableId - The ID of the table
   * @param {Object} [options] - Optional parameters
   * @param {string} [options.view] - View ID to filter by
   * @param {number} [options.pageSize=100] - Number of records per page
   * @param {string} [options.offset] - Offset for pagination
   * @returns {Promise<Object>} Records with pagination info
   */
  async getRecords(baseId, tableId, options = {}) {
    console.log("Getting record for table", tableId);
    if (!baseId || !tableId) {
      throw new Error("Base ID and Table ID are required");
    }

    const params = {
      pageSize: options.pageSize || 100,
      ...(options.view && { view: options.view }),
      ...(options.offset && { offset: options.offset }),
    };

    const response = await this.apiService.client.get(`/${baseId}/${tableId}`, {
      params,
    });
    console.log(response.data.records.length);
    return response?.data || {};
  }

  /**
   * Get all users
   * @returns {Promise<Array>} List of users
   */
  async getUsers() {
    const response = await this.apiService.client.get("/Users");
    return response?.data?.records || [];
  }

  /**
   * Get all records from a table with automatic pagination
   * @param {string} baseId - The ID of the base
   * @param {string} tableId - The ID of the table
   * @param {Object} [options] - Optional parameters
   * @param {string} [options.view] - View ID to filter by
   * @param {number} [options.pageSize=100] - Number of records per page
   * @returns {Promise<Array>} All records from the table
   */
  async getAllRecords(baseId, tableId, options = {}) {
    let allRecords = [];
    let offset = null;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getRecords(baseId, tableId, {
        ...options,
        offset,
      });

      allRecords = [...allRecords, ...(response.records || [])];
      offset = response.offset;
      hasMore = !!offset;
    }

    return allRecords;
  }
}

export default AirTableDataService;

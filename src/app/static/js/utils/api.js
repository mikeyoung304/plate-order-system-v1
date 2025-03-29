/**
 * API Utilities
 */

/**
 * Fetch data from the API
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - The response data
 */
export async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Post data to the API
 * @param {string} url - The URL to post to
 * @param {Object} data - The data to post
 * @returns {Promise<any>} - The response data
 */
export async function postData(url, data) {
  return fetchData(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Put data to the API
 * @param {string} url - The URL to put to
 * @param {Object} data - The data to put
 * @returns {Promise<any>} - The response data
 */
export async function putData(url, data) {
  return fetchData(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Delete data from the API
 * @param {string} url - The URL to delete from
 * @returns {Promise<any>} - The response data
 */
export async function deleteData(url) {
  return fetchData(url, {
    method: 'DELETE'
  });
}

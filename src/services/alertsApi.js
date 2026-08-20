import axios from 'axios';

const RELIEFWEB_API_URL = 'https://api.reliefweb.int/v1/disasters';

export const fetchDisasters = async () => {
  try {
    const response = await axios.get(RELIEFWEB_API_URL, {
      params: {
        appname: 'kalasag',
        profile: 'list',
        preset: 'latest',
        'query[value]': 'country:Philippines',
      },
    });
    return response.data.disasters;
  } catch (error) {
    console.error('Error fetching disasters from ReliefWeb:', error);
    throw error;
  }
};

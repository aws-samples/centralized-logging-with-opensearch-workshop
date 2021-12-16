import axios from 'axios'

import Swal from 'sweetalert2'

const instance = axios.create({
  baseURL: 'http://localhost:4000/',
  headers: {
    'Content-Type': 'application/json',
  },
})

instance.interceptors.request.use(
  (config) => {
    return config
  },
  function (error) {
    return Promise.reject(error)
  },
)

instance.interceptors.response.use(
  (response) => {
    console.info('response:', response)
    return Promise.resolve(response)
  },
  (error) => {
    console.info('ERR:', error.response)
    // Swal.fire(error.message);
    Swal.fire(
      `${error.message}`,
      `${error?.response?.config?.url} \n ${
        error?.response?.config?.params
          ? JSON.stringify(error?.response?.config?.params)
          : ''
      }`,
      undefined,
    )
    console.log('-- error --')
    console.error(error)
    console.log('-- error --')
    return Promise.reject({
      success: false,
      msg: error,
    })
  },
)

export default instance

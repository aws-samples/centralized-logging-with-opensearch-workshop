/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import axios from 'axios'
import Swal from 'sweetalert2'

const instance = axios.create({
  baseURL: '/',
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

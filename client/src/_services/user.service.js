import { authHeader } from "../_helpers";
import { appConstants } from "../_constants";
export const userService = {
  login,
  logout,
  getAll
};

function login(username, password) {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: username, password })
  };
  return fetch(appConstants.API_HOST_UMS + "/users/login", requestOptions)
    .then(response => {
      if (!response.ok) {
        return Promise.reject(response.statusText);
      }

      return response.json();
    })
    .then(response => {
      // login successful if there's a jwt token in the response
      if (response && response.ok && response.data && response.data.token) {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        localStorage.setItem("token", JSON.stringify(response.data.token));
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data.user;
    });
}

function logout() {
  // remove user from local storage to log user out
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

function getAll() {
  const requestOptions = {
    method: "GET"
  };

  // console.log("enoueza el juego " + appConstants.API_HOST+ '/users');
  // return fetch(appConstants.API_HOST + '/users', requestOptions);
  return fetch(appConstants.API_HOST + "/users", requestOptions).then(
    response => {
      if (!response.ok) {
        return Promise.reject(response.statusText);
      }

      return response.json();
    }
  );
}

function handleResponse(response) {
  console.log("aqui eso");
  if (!response.ok) {
    return Promise.reject(response.statusText);
  }

  return response.json();
}

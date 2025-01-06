import { parseComponentData, isAuthorized, getUser } from "./util"

function auth() {
  // Get unauthorized and authorized elements
  const unauthorized = document.getElementById("protected-content-unauthorized")
  const authorized = document.getElementById("protected-content-authorized")
  if (!unauthorized || !authorized) {
    // console.warn("Could not find protected-content-unauthorized or protected-content-authorized")
    return
  }

  const user = getUser() ?? ""
  const parsedComponentData = parseComponentData() ?? ""

  if (isAuthorized(user, parsedComponentData)) {
    unauthorized.style.display = "none"
    authorized.style.display = "block"
  } else {
    unauthorized.style.display = "block"
    authorized.style.display = "none"
  }
}

document.addEventListener("nav", () => auth())
// window.addCleanup(() => document.removeEventListener("nav", () => auth()))


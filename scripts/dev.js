const shell = require("shelljs")
shell.exec("npm run build -- --watch", { async: true })
shell.exec("ionic serve --no-interactive", { async: true })

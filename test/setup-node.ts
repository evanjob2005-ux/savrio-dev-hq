// Route unit tests invoke handlers directly, outside the proxy that normally
// supplies the deployment boundary. Make that test deployment explicit rather
// than relying on NODE_ENV as an implicit trust signal.
process.env.DEV_HQ_DEPLOYMENT_MODE = "local";

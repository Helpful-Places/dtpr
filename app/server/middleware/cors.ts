import cors from 'cors'

export default defineEventHandler(({ req, res }) => new Promise((resolve) => cors()(req, res, resolve)));
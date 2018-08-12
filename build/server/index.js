const express = require('express')
const morgan = require('morgan')
const { resolve } = require('path')

const app = express()
const root = resolve(__dirname, '../client')

const port = 3000

console.log(`Server started on ${port}`)
app.use(morgan('dev'))
app.use('/api/ping', (req, res) => res.json())
app.use(express.static(root, { maxAge: 31536000000, index: false }))
app.use('/*', (req, res) => res.sendFile('/index.html', { root, maxAge: 0 }))
app.listen(port)

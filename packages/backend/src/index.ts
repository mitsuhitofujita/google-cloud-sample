import fastify from 'fastify'

const server = fastify()

const port = Number(process.env.PORT) || 8080

// ヘルスチェック用のルートパス
server.get('/', async (_request, _reply) => {
  return { status: 'ok' }
})

server.get('/ping', async (_request, _reply) => {
  return 'pong\n'
})

server.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})

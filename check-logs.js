const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const logs = await prisma.botLog.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('=== Son 15 Bot Logu ===\n')
  logs.reverse().forEach(l => {
    const time = new Date(l.createdAt).toLocaleTimeString('tr-TR')
    console.log(`[${time}] ${l.type}: ${l.message}`)
  })
  
  const contacts = await prisma.linkedInContact.findMany()
  console.log(`\n=== Toplam ${contacts.length} kişi bulundu ===`)
  contacts.forEach(c => {
    console.log(`  - ${c.firstName} ${c.lastName} (${c.title}) - ${c.status}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())


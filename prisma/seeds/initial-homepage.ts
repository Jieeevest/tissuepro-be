import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ── Products ─────────────────────────────────────────────────────────────────

  const products = [
    {
      id: 'hp-product-exother1',
      name: 'ExoTher 1',
      series: 'amniotic',
      nanoparticles: '1 Billion Nanoparticles',
      type: 'MSC Amniotic Derived',
      description: 'Optimal concentration for dermatology, aesthetic medicine, and hair restoration.',
      status: 'aktif',
      order: 1,
    },
    {
      id: 'hp-product-exopro',
      name: 'ExoPro',
      series: 'amniotic',
      nanoparticles: '300 Billion Nanoparticles',
      type: 'MSC Amniotic Derived',
      description: 'Professional-grade high-concentration formulation for advanced clinical cases.',
      status: 'aktif',
      order: 2,
    },
    {
      id: 'hp-product-exomatrix',
      name: 'ExoMatrix',
      series: 'amniotic',
      nanoparticles: '1.5 Trillion Nanoparticles',
      type: 'MSC Amniotic Derived — Special Order',
      description: 'Ultra-high concentration formulation. Available as special order under full medical supervision.',
      status: 'aktif',
      order: 3,
    },
    {
      id: 'hp-product-exolite',
      name: 'ExoLite',
      series: 'placental',
      nanoparticles: '750 Billion Nanoparticles',
      type: 'Placental Cord MSC',
      description: 'Standard Placental Cord formulation for aesthetic and dermatology applications.',
      status: 'aktif',
      order: 1,
    },
    {
      id: 'hp-product-exogen',
      name: 'ExoGen',
      series: 'placental',
      nanoparticles: '1.5 Trillion Nanoparticles',
      type: 'Placental Cord MSC — Special Order',
      description: 'Ultra-high concentration Placental Cord formulation. Available as special order under full medical supervision.',
      status: 'aktif',
      order: 2,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    })
  }

  console.log(`  ✓ ${products.length} products`)

  // ── Application Areas ─────────────────────────────────────────────────────────

  const areas = [
    { id: 'hp-area-1', name: 'Facial Rejuvenation',  specialty: 'Aesthetic Medicine',                  description: 'Exosome-mediated signaling for skin renewal, collagen stimulation, and aesthetic restoration.',                  icon: 'sparkles', order: 1, is_active: true  },
    { id: 'hp-area-2', name: 'Psoriasis Treatment',  specialty: 'Dermatology · Immunology',            description: 'Immunomodulatory properties applied to autoimmune skin conditions, reducing inflammatory cascades.',             icon: 'shield',   order: 2, is_active: true  },
    { id: 'hp-area-3', name: 'Hair Growth Boost',    specialty: 'Trichology',                          description: 'Reactivating dormant follicles and stimulating natural hair regrowth and density restoration.',                 icon: 'wind',     order: 3, is_active: true  },
    { id: 'hp-area-4', name: 'Facial Tics',          specialty: 'Neurology',                           description: 'Exploring neurophysiology pathways for motor control and involuntary movement reduction.',                      icon: 'brain',    order: 4, is_active: true  },
    { id: 'hp-area-5', name: 'Osteoarthritis',       specialty: 'Orthopedics · Degenerative Medicine', description: 'Cartilage repair, joint inflammation reduction, and musculoskeletal healing.',                                  icon: 'activity', order: 5, is_active: true  },
    { id: 'hp-area-6', name: 'Bone Regeneration',    specialty: 'Orthopedics · Oncology',              description: 'High-concentration platforms for accelerating bone healing and skeletal tissue engineering.',                    icon: 'bone',     order: 6, is_active: true  },
    { id: 'hp-area-7', name: 'Hemorrhagic Stroke',   specialty: 'Neurology · Neurorehabilitation',     description: 'Neuroprotective protocols supporting motor recovery post-stroke.',                                              icon: 'zap',      order: 7, is_active: true  },
    { id: 'hp-area-8', name: 'Cerebral Palsy',       specialty: 'Pediatric Neurology',                 description: 'Pediatric neurological applications exploring motor and neurodevelopmental support.',                           icon: 'baby',     order: 8, is_active: true  },
  ]

  for (const area of areas) {
    await prisma.applicationArea.upsert({
      where: { id: area.id },
      update: area,
      create: area,
    })
  }

  console.log(`  ✓ ${areas.length} application areas`)

  // ── Pipeline ──────────────────────────────────────────────────────────────────

  const pipelineItems = [
    { id: 'hp-pipe-1', product_name: 'ExoMatrix', platform: 'Neurological Platform',  stage: 'pre-clinical',  order: 1 },
    { id: 'hp-pipe-2', product_name: 'ExoTher 3', platform: 'Orthopedic Platform',    stage: 'research',       order: 2 },
    { id: 'hp-pipe-3', product_name: 'ExoGen',    platform: 'Dermatology Platform',   stage: 'special-order', order: 3 },
    { id: 'hp-pipe-4', product_name: 'ExoPro',    platform: 'Aesthetic Platform',     stage: 'early-research', order: 4 },
  ]

  for (const item of pipelineItems) {
    await prisma.pipelineItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  }

  console.log(`  ✓ ${pipelineItems.length} pipeline items`)

  // ── Case Studies ──────────────────────────────────────────────────────────────

  const DISCLAIMER = 'Observational clinical data from professional use. Not an RCT. Not intended as efficacy claims or regulatory endorsement. For medical professionals only.'

  const caseStudies = [
    {
      id: 'hp-case-1',
      specialty: 'Neurology',
      title: 'Facial Tics & Involuntary Movement',
      patient_description: 'Patient with facial tics (involuntary movement) and pain.',
      disclaimer: DISCLAIMER,
      is_published: true,
      images: [
        { src: '/case-images/facial-tics-pre.jpg', caption: 'Pretreatment',           order: 0 },
        { src: '/case-images/facial-tics-20s.jpg', caption: '20 sec post treatment',  order: 1 },
        { src: '/case-images/facial-tics-3w.jpg',  caption: '3rd visit (3 weeks)',    order: 2 },
      ],
      metrics: [
        { label: 'Initial response — immediate tic reduction',         value: '20 seconds', order: 0 },
        { label: '3rd visit — sustained resolution, no pain reported', value: '3 weeks',    order: 1 },
      ],
    },
    {
      id: 'hp-case-2',
      specialty: 'Dermatology',
      title: 'Severe Psoriasis — Full Body Coverage',
      patient_description: '37-year-old patient · >95% BSA affected · Treatment: ExoTher 1 Billion Nanoparticles.',
      disclaimer: DISCLAIMER,
      is_published: true,
      images: [
        { src: '/case-images/psoriasis-pre.jpg',  caption: 'Pre-treatment',          order: 0 },
        { src: '/case-images/psoriasis-post.jpg', caption: '2 Weeks Post-treatment', order: 1 },
      ],
      metrics: [
        { label: 'Body surface area affected pre-treatment',  value: '>95% BSA', order: 0 },
        { label: 'Near-complete skin clearance post ExoTher', value: '2 Weeks',  order: 1 },
      ],
    },
    {
      id: 'hp-case-3',
      specialty: 'Neurology · Neurorehabilitation',
      title: 'Hemorrhagic Stroke Recovery',
      patient_description: 'Wheelchair-bound patient with lower limb paralysis — 2-month exosome treatment protocol.',
      disclaimer: DISCLAIMER,
      is_published: true,
      images: [
        { src: '/case-images/stroke-pre.jpg',  caption: 'Pre-treatment',           order: 0 },
        { src: '/case-images/stroke-post.jpg', caption: '2 Months Post-treatment', order: 1 },
      ],
      metrics: [
        { label: 'Treatment duration to ambulation',                 value: '2 Months',  order: 0 },
        { label: 'Patient walking with cane support post-treatment', value: 'Ambulatory', order: 1 },
      ],
    },
    {
      id: 'hp-case-4',
      specialty: 'Orthopedics',
      title: 'Knee Osteoarthritis (OA)',
      patient_description: 'Radiographic joint space increase at 1 month · VRS pain scale near-zero at 6 months.',
      disclaimer: DISCLAIMER,
      is_published: true,
      images: [
        { src: '/case-images/oa-before.jpg', caption: 'Before',        order: 0 },
        { src: '/case-images/oa-after.jpg',  caption: 'After 1 Month', order: 1 },
      ],
      metrics: [
        { label: 'Visible joint space increase on X-ray',                value: '1 Month',     order: 0 },
        { label: 'Pain-free at rest & activity — sustained to 6 months', value: 'VRS Score 0', order: 1 },
      ],
    },
    {
      id: 'hp-case-5',
      specialty: 'Pediatric Neurology',
      title: 'Cerebral Palsy — Pediatric Case',
      patient_description: 'Patient Syamil — Improvement in sitting endurance and core strength from Day 3.',
      disclaimer: DISCLAIMER,
      is_published: true,
      images: [
        { src: '/case-images/cp-syamil.jpg', caption: 'Patient Syamil', order: 0 },
      ],
      metrics: [
        { label: 'Day 3',          value: 'Sitting endurance improved — from 5 min to sustained periods without fatigue',     order: 0 },
        { label: 'Motor',          value: 'Visible core muscle activation improvement; physical therapy ongoing alongside treatment', order: 1 },
        { label: 'Neurological',   value: 'No severe headache episodes reported through observation period',                   order: 2 },
        { label: 'Adverse Events', value: 'Mild transient facial rash noted — self-resolving, non-distressing',               order: 3 },
      ],
    },
  ]

  for (const { id, images, metrics, ...data } of caseStudies) {
    await prisma.$transaction(async (tx) => {
      await tx.caseStudy.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      })
      await tx.caseStudyImage.deleteMany({ where: { case_study_id: id } })
      await tx.caseStudyImage.createMany({
        data: images.map((img) => ({ ...img, case_study_id: id })),
      })
      await tx.caseStudyMetric.deleteMany({ where: { case_study_id: id } })
      await tx.caseStudyMetric.createMany({
        data: metrics.map((m) => ({ ...m, case_study_id: id })),
      })
    })
  }

  console.log(`  ✓ ${caseStudies.length} case studies`)
}

main()
  .then(() => console.log('Seed initial-homepage selesai.'))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

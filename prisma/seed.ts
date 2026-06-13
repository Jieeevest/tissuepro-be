import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const already = await prisma.user.findUnique({
    where: { email: "admin@tissuepro.id" },
  });
  if (already) {
    console.log("Seed sudah dijalankan sebelumnya. Skip.");
    return;
  }

  console.log("Seeding database...");

  // Default admin user
  await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@tissuepro.id",
      password: await bcrypt.hash("tissuepro2026", 12),
      role: "admin",
      subscription_tier: "admin",
    },
  });

  // ── Products ────────────────────────────────────────────────────────────────

  const stainingProducts = [
    {
      name: "AFS Premium 100ml",
      series: "staining",
      nanoparticles: "100ml",
      type: "Amniotic Fluid Substitute — Tissue Preservation",
      description:
        "Superior tissue preservation solution that maintains structural integrity better than standard PBS. Ideal for long-term specimen storage and processing.",
      status: "aktif",
      order: 1,
    },
    {
      name: "AFS Premium 500ml",
      series: "staining",
      nanoparticles: "500ml",
      type: "Amniotic Fluid Substitute — Tissue Preservation",
      description:
        "Superior tissue preservation solution that maintains structural integrity better than standard PBS. Ideal for long-term specimen storage and processing.",
      status: "aktif",
      order: 2,
    },
    {
      name: "AFS Premium 1000ml",
      series: "staining",
      nanoparticles: "1000ml",
      type: "Amniotic Fluid Substitute — Tissue Preservation",
      description:
        "Superior tissue preservation solution that maintains structural integrity better than standard PBS. Ideal for long-term specimen storage and processing.",
      status: "aktif",
      order: 3,
    },
    {
      name: "H&E Complete Kit",
      series: "staining",
      nanoparticles: "Kit — 500ml Each",
      type: "Hematoxylin & Eosin — Ready-to-Use",
      description:
        "Combined H&E staining solution for optimal nuclear and cytoplasmic contrast. Consistent, vibrant results in every histological application.",
      status: "aktif",
      order: 4,
    },
    {
      name: "CV Staining Set 100ml",
      series: "staining",
      nanoparticles: "100ml",
      type: "Cresyl Violet — Special Staining",
      description:
        "High-performance cresyl violet for Nissl substance visualization. Essential for neural tissue histochemistry and neuropathology research.",
      status: "aktif",
      order: 5,
    },
    {
      name: "CV Staining Set 500ml",
      series: "staining",
      nanoparticles: "500ml",
      type: "Cresyl Violet — Special Staining",
      description:
        "High-performance cresyl violet for Nissl substance visualization. Essential for neural tissue histochemistry and neuropathology research.",
      status: "aktif",
      order: 6,
    },
  ];

  const bufferProducts = [
    {
      name: "PBS 1x Standard 500ml",
      series: "buffer",
      nanoparticles: "500ml",
      type: "Phosphate Buffered Saline",
      description:
        "Standard isotonic buffer for tissue washing, dilution, and cell culture applications. Endotoxin-tested and sterile-filtered.",
      status: "aktif",
      order: 1,
    },
    {
      name: "PBS 1x Standard 1000ml",
      series: "buffer",
      nanoparticles: "1000ml",
      type: "Phosphate Buffered Saline",
      description:
        "Standard isotonic buffer for tissue washing, dilution, and cell culture applications. Endotoxin-tested and sterile-filtered.",
      status: "aktif",
      order: 2,
    },
    {
      name: "PBS 10x Concentrate 500ml",
      series: "buffer",
      nanoparticles: "500ml",
      type: "Phosphate Buffered Saline — Concentrated",
      description:
        "High-concentration PBS for labs requiring custom dilutions. Economical option for high-volume laboratory users.",
      status: "aktif",
      order: 3,
    },
    {
      name: "PBS 10x Concentrate 1000ml",
      series: "buffer",
      nanoparticles: "1000ml",
      type: "Phosphate Buffered Saline — Concentrated",
      description:
        "High-concentration PBS for labs requiring custom dilutions. Economical option for high-volume laboratory users.",
      status: "aktif",
      order: 4,
    },
  ];

  for (const p of [...stainingProducts, ...bufferProducts]) {
    await prisma.product.create({
      data: { id: `product-${p.name.toLowerCase().replace(/[\s&]/g, "-")}`, ...p },
    });
  }

  // ── Pipeline ─────────────────────────────────────────────────────────────────

  const pipelineItems = [
    {
      product_name: "AFS Enhanced",
      platform: "Tissue Preservation Platform",
      stage: "research",
      order: 1,
    },
    {
      product_name: "NeuroStain Pro",
      platform: "Neuroscience Platform",
      stage: "pre-clinical",
      order: 2,
    },
    {
      product_name: "MultiStain Kit",
      platform: "Multiplex Staining Platform",
      stage: "early-research",
      order: 3,
    },
    {
      product_name: "PBS Ultra-Pure",
      platform: "Buffer Solutions Platform",
      stage: "research",
      order: 4,
    },
  ];

  for (let i = 0; i < pipelineItems.length; i++) {
    await prisma.pipelineItem.create({
      data: { id: `pipeline-${i + 1}`, ...pipelineItems[i] },
    });
  }

  // ── Laboratory Application Areas ─────────────────────────────────────────────

  const areas = [
    {
      name: "Histology",
      specialty: "Tissue Pathology",
      description:
        "Standard staining procedures for tissue section preparation and morphological analysis in diagnostic and research pathology.",
      icon: "microscope",
      order: 1,
      is_active: true,
    },
    {
      name: "Neuropathology",
      specialty: "Neuroscience Research",
      description:
        "Specialized staining for neural tissue characterization, Nissl body visualization, and neurodegenerative disease studies.",
      icon: "brain",
      order: 2,
      is_active: true,
    },
    {
      name: "Dermatopathology",
      specialty: "Dermatology Research",
      description:
        "Skin tissue processing and staining for dermatological diagnosis and cutaneous pathology research applications.",
      icon: "shield",
      order: 3,
      is_active: true,
    },
    {
      name: "Oncology Research",
      specialty: "Cancer Biology",
      description:
        "Tumor tissue processing and staining for cancer biomarker analysis, histological grading, and pathological staging.",
      icon: "activity",
      order: 4,
      is_active: true,
    },
    {
      name: "Pharmaceutical R&D",
      specialty: "Drug Development",
      description:
        "Tissue analysis for drug efficacy and toxicology studies in pharmaceutical research and development pipelines.",
      icon: "zap",
      order: 5,
      is_active: true,
    },
    {
      name: "Academic Research",
      specialty: "University Laboratories",
      description:
        "High-quality reagents for teaching, training, and investigative research in academic and university settings.",
      icon: "award",
      order: 6,
      is_active: true,
    },
    {
      name: "Clinical Pathology",
      specialty: "Hospital Laboratories",
      description:
        "Reliable staining solutions for routine clinical pathology diagnostics and patient tissue analysis workflows.",
      icon: "check-circle",
      order: 7,
      is_active: true,
    },
    {
      name: "Biomedical Research",
      specialty: "Translational Science",
      description:
        "Supporting translational research from bench to bedside with consistent, validated laboratory reagents.",
      icon: "dna",
      order: 8,
      is_active: true,
    },
  ];

  for (const area of areas) {
    await prisma.applicationArea.create({
      data: { id: `area-${area.order}`, ...area },
    });
  }

  // ── Research Case Studies ────────────────────────────────────────────────────

  const caseStudies = [
    {
      id: "case-1",
      specialty: "Neuropathology",
      title: "Nissl Staining with CV Staining Set",
      patient_description:
        "Evaluation of CV staining kit performance in hippocampal section preparation for neural tissue analysis.",
      disclaimer:
        "Performance data from research laboratory evaluation. For scientific reference only.",
      is_published: true,
      images: [
        {
          src: "https://picsum.photos/seed/tissuepro-neuro/480/560",
          caption: "Hippocampal section — CV stained",
          order: 0,
        },
      ],
      metrics: [
        {
          label: "Staining clarity — sharp nuclear definition achieved",
          value: "Excellent",
          order: 0,
        },
        {
          label: "Protocol preparation time from start to finish",
          value: "< 30 min",
          order: 1,
        },
      ],
    },
    {
      id: "case-2",
      specialty: "Oncology Research",
      title: "H&E Staining in Breast Tumor Sections",
      patient_description:
        "H&E Complete Kit performance evaluation for breast tumor tissue characterization and histological grading.",
      disclaimer:
        "Performance data from research laboratory evaluation. For scientific reference only.",
      is_published: true,
      images: [
        {
          src: "https://picsum.photos/seed/tissuepro-onco/480/560",
          caption: "Breast tumor section — H&E stained",
          order: 0,
        },
      ],
      metrics: [
        {
          label: "Nuclear-cytoplasmic contrast quality",
          value: "Excellent",
          order: 0,
        },
        {
          label: "Batch-to-batch reproducibility",
          value: "Consistent",
          order: 1,
        },
      ],
    },
    {
      id: "case-3",
      specialty: "Tissue Preservation",
      title: "AFS vs PBS Long-Term Preservation Study",
      patient_description:
        "Comparative study evaluating tissue morphology retention at 6 months using AFS Premium versus standard PBS.",
      disclaimer:
        "Performance data from research laboratory evaluation. For scientific reference only.",
      is_published: true,
      images: [
        {
          src: "https://picsum.photos/seed/tissuepro-pres/480/560",
          caption: "Tissue morphology comparison at 6 months",
          order: 0,
        },
      ],
      metrics: [
        {
          label: "Tissue morphology retention at 6 months",
          value: "Superior in AFS",
          order: 0,
        },
        {
          label: "Structural integrity score",
          value: "Excellent",
          order: 1,
        },
      ],
    },
    {
      id: "case-4",
      specialty: "Dermatopathology",
      title: "Skin Biopsy Processing with H&E Complete",
      patient_description:
        "Performance evaluation of H&E Complete Kit in routine skin biopsy processing for dermatopathology diagnostics.",
      disclaimer:
        "Performance data from research laboratory evaluation. For scientific reference only.",
      is_published: true,
      images: [
        {
          src: "https://picsum.photos/seed/tissuepro-derm/480/560",
          caption: "Skin biopsy section — H&E stained",
          order: 0,
        },
      ],
      metrics: [
        {
          label: "Diagnostic clarity for pathologist review",
          value: "High",
          order: 0,
        },
        {
          label: "Turnaround time reduction vs. prior reagent",
          value: "20%",
          order: 1,
        },
      ],
    },
  ];

  for (const { id, images, metrics, ...data } of caseStudies) {
    await prisma.caseStudy.create({
      data: {
        id,
        ...data,
        images: { create: images },
        metrics: { create: metrics },
      },
    });
  }

  // ── General Settings ─────────────────────────────────────────────────────────

  const settings: Record<string, string> = {
    site_name: "TissuePro Teknologi Indonesia",
    site_description: "Distributor Resmi Reagen Laboratorium Premium TissuePro Technology USA di Indonesia",
    contact_email: "customerservice@tissueprotech.com",
    whatsapp_number: "+6281234567890",
    address: "Florida, United States of America",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.generalSetting.create({ data: { key, value } });
  }

  console.log("Seed selesai.");
  console.log("Admin → admin@tissuepro.id / tissuepro2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

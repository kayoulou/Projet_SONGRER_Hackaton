import bcrypt from "bcryptjs";
import { PrismaClient, ReportChannel, ReportStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@songrer.org";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrateur Principal",
      role: UserRole.SUPER_ADMIN,
      passwordHash: await bcrypt.hash(adminPassword, 12)
    }
  });

  const organizations = [
    { id: "ong_voix_femmes", name: "Voix de Femmes", distance: "2km", phone: "+226 25 30 00 00", icon: "home" },
    { id: "ong_cellule_vbg", name: "Cellule VBG", distance: "5km", phone: "+226 70 20 20 20", icon: "shield" },
    { id: "ong_clin_oeil", name: "Association Clin d'Oeil", distance: "7km", phone: "+226 76 00 11 22", icon: "heart" }
  ];

  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: org,
      create: org
    });
  }

  await prisma.statistic.upsert({
    where: { id: "global" },
    update: { callsToday: 0, activeCases: 0, womenHelped: 0 },
    create: { id: "global", callsToday: 0, activeCases: 0, womenHelped: 0 }
  });

  const videos = [
    {
      id: "vid_demo_1",
      title: "Témoignage : survivre aux violences conjugales",
      author: "@association_espoir",
      location: "Afrique",
      duration: "1:57",
      url: "https://songrer-media.s3.amazonaws.com/videos/witness1.mp4",
      views: "1.2k",
      likes: 1200,
      commentsCount: 342,
      sharesCount: 56,
      description: "Témoignage de résilience d'une survivante de violences conjugales.",
      thumbnailUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=640&auto=format&fit=crop",
      isPublished: true
    },
    {
      id: "vid_demo_2",
      title: "VBG : les voix des survivantes s'unissent",
      author: "@alliance_vbg",
      location: "Sénégal",
      duration: "3:24",
      url: "https://songrer-media.s3.amazonaws.com/videos/witness2.mp4",
      views: "850",
      likes: 412,
      commentsCount: 98,
      sharesCount: 19,
      description: "Témoignages de femmes victimes de violences basées sur le genre.",
      thumbnailUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=640&auto=format&fit=crop",
      isPublished: true
    },
    {
      id: "vid_demo_3",
      title: "Reconstruction : le témoignage de Grâce",
      author: "@grace_temoignage",
      location: "Burkina Faso",
      duration: "8:45",
      url: "https://songrer-media.s3.amazonaws.com/videos/witness3.mp4",
      views: "2.1k",
      likes: 1840,
      commentsCount: 520,
      sharesCount: 110,
      description: "Parcours de reconstruction après des violences conjugales.",
      thumbnailUrl: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=640&auto=format&fit=crop",
      isPublished: true
    },
    {
      id: "vid_demo_4",
      title: "Sensibilisation : briser le silence des VBG",
      author: "@sensibilisation_vbg",
      location: "Burkina Faso",
      duration: "3:38",
      url: "https://songrer-media.s3.amazonaws.com/videos/witness4.mp4",
      views: "1.5k",
      likes: 980,
      commentsCount: 230,
      sharesCount: 45,
      description: "Conseils pour réagir et trouver de l'aide en sécurité.",
      thumbnailUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=640&auto=format&fit=crop",
      isPublished: true
    }
  ];

  for (const video of videos) {
    await prisma.video.upsert({
      where: { id: video.id },
      update: video,
      create: video
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });


import { prisma } from './src/config/db.js';
import { hashPassword } from './src/utils/password.js';

async function seed() {
  console.log('--- Starting Seed Script ---');
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL successfully.');

    // 1. Ensure Verified User & Admin
    const userPasswordHash = await hashPassword('Password123!');
    const adminPasswordHash = await hashPassword('Admin123!');

    const testUser = await prisma.user.upsert({
      where: { email: 'testuser@seatlock.com' },
      update: { name: 'Alex Vance', passwordHash: userPasswordHash, role: 'USER' },
      create: {
        email: 'testuser@seatlock.com',
        name: 'Alex Vance',
        passwordHash: userPasswordHash,
        role: 'USER',
      },
    });
    console.log(`User created/updated: ${testUser.email} (ID: ${testUser.id})`);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@seatlock.com' },
      update: { name: 'Lumière Admin', passwordHash: adminPasswordHash, role: 'ADMIN' },
      create: {
        email: 'admin@seatlock.com',
        name: 'Lumière Admin',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
      },
    });
    console.log(`Admin created/updated: ${adminUser.email} (ID: ${adminUser.id})`);

    // 2. Ensure Blockbuster Movies
    const moviesData = [
      {
        title: 'Interstellar: The IMAX Experience',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival across the cosmos.',
        durationMin: 169,
        language: 'English',
        genre: 'Sci-Fi / Adventure',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        releaseDate: new Date('2026-10-15'),
        isActive: true,
      },
      {
        title: 'Dune: Part Two (Dolby Atmos)',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        durationMin: 166,
        language: 'English',
        genre: 'Sci-Fi / Epic',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        releaseDate: new Date('2026-10-20'),
        isActive: true,
      },
      {
        title: 'The Dark Knight (Remastered)',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        durationMin: 152,
        language: 'English',
        genre: 'Action / Crime',
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        releaseDate: new Date('2026-10-24'),
        isActive: true,
      },
      {
        title: 'Cyberpunk: Neon Horizon 2026',
        description: 'In a dystopian mega-city bathed in neon, an elite operative discovers a sentient AI conspiracy that threatens human consciousness.',
        durationMin: 140,
        language: 'Hindi',
        genre: 'Action / Sci-Fi',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        releaseDate: new Date('2026-11-01'),
        isActive: true,
      },
      {
        title: 'Echoes of the Deep',
        description: 'An oceanic exploration crew uncovers an ancient biome beneath the Mariana Trench that defies modern physics.',
        durationMin: 128,
        language: 'Hindi',
        genre: 'Thriller / Mystery',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        releaseDate: new Date('2026-11-15'),
        isActive: true,
      }
    ];

    const seededMovies = [];
    for (const m of moviesData) {
      const existing = await prisma.movie.findFirst({ where: { title: m.title } });
      if (existing) {
        const updated = await prisma.movie.update({
          where: { id: existing.id },
          data: m,
        });
        seededMovies.push(updated);
      } else {
        const created = await prisma.movie.create({ data: m });
        seededMovies.push(created);
      }
    }
    console.log(`Seeded ${seededMovies.length} movies.`);

    // 3. Ensure Theater
    let theater = await prisma.theater.findFirst({
      where: { name: 'Lumière Grand CineLounge - Pacific Mall' }
    });
    if (!theater) {
      theater = await prisma.theater.create({
        data: {
          name: 'Lumière Grand CineLounge - Pacific Mall',
          address: 'Level 4, Subhash Nagar, Pacific Mall',
          city: 'Delhi NCR',
          state: 'Delhi',
          isActive: true,
        }
      });
    }
    console.log(`Theater ready: ${theater.name} (ID: ${theater.id})`);

    // 4. Ensure Screen
    let screen = await prisma.screen.findFirst({
      where: { theaterId: theater.id, name: 'Auditorium 01 (Dolby Atmos Laser)' }
    });
    if (!screen) {
      screen = await prisma.screen.create({
        data: {
          theaterId: theater.id,
          name: 'Auditorium 01 (Dolby Atmos Laser)',
          totalSeats: 60,
          isActive: true,
        }
      });
    }
    console.log(`Screen ready: ${screen.name} (ID: ${screen.id})`);

    // 5. Ensure Seats for Screen (Rows A to F, 10 seats each)
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const seatsCount = await prisma.seat.count({ where: { screenId: screen.id } });
    if (seatsCount === 0) {
      console.log('Generating seats for screen...');
      const seatsToCreate = [];
      for (const row of rowLabels) {
        for (let num = 1; num <= 10; num++) {
          let seatType = 'REGULAR';
          if (row === 'E' || row === 'F') seatType = 'RECLINER';
          else if (row === 'C' || row === 'D') seatType = 'PREMIUM';

          seatsToCreate.push({
            screenId: screen.id,
            rowLabel: row,
            seatNumber: num,
            seatType,
          });
        }
      }
      await prisma.seat.createMany({ data: seatsToCreate });
      console.log(`Created ${seatsToCreate.length} seats.`);
    }

    const allSeats = await prisma.seat.findMany({ where: { screenId: screen.id } });

    // 6. Ensure Upcoming Shows and ShowSeats
    const now = new Date();
    for (let i = 0; i < seededMovies.length; i++) {
      const movie = seededMovies[i];
      // Create a show today and tomorrow
      for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
        const showStartTime = new Date(now.getTime() + (dayOffset * 24 + 3 + i * 2) * 60 * 60 * 1000);
        const showEndTime = new Date(showStartTime.getTime() + movie.durationMin * 60 * 1000);

        // Check if show already exists
        let show = await prisma.show.findFirst({
          where: {
            movieId: movie.id,
            screenId: screen.id,
            startTime: {
              gte: new Date(showStartTime.getTime() - 3600000),
              lte: new Date(showStartTime.getTime() + 3600000),
            }
          }
        });

        if (!show) {
          show = await prisma.show.create({
            data: {
              movieId: movie.id,
              screenId: screen.id,
              startTime: showStartTime,
              endTime: showEndTime,
              language: movie.language,
              basePrice: 350.00,
              isActive: true,
            }
          });

          // Create show seats
          const showSeatsData = allSeats.map(seat => {
            let price = 350;
            if (seat.seatType === 'PREMIUM') price = 480;
            if (seat.seatType === 'RECLINER') price = 650;
            return {
              showId: show.id,
              seatId: seat.id,
              status: 'AVAILABLE',
              price,
              version: 0,
            };
          });

          await prisma.showSeat.createMany({ data: showSeatsData });
          console.log(`Created show for ${movie.title} with ${showSeatsData.length} show seats.`);
        }
      }
    }

    console.log('=== Database Seeding Complete & Verified ===');
  } catch (error) {
    console.error('Seed script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();


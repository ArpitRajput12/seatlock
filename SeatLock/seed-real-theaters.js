import { prisma } from './src/config/db.js';
import { hashPassword } from './src/utils/password.js';

async function seedRealTheaters() {
  console.log('=== Cleaning Database & Seeding Real Theaters ===');

  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL.');

    // 1. Clean old transactions, show seats, shows, seats, screens, theaters
    console.log('Cleaning old bookings, payments, show_seats, shows...');
    await prisma.bookingCoupon.deleteMany({}).catch(() => {});
    await prisma.bookingSeat.deleteMany({}).catch(() => {});
    await prisma.payment.deleteMany({}).catch(() => {});
    await prisma.booking.deleteMany({}).catch(() => {});
    await prisma.showSeat.deleteMany({}).catch(() => {});
    await prisma.show.deleteMany({}).catch(() => {});
    await prisma.seat.deleteMany({}).catch(() => {});
    await prisma.screen.deleteMany({}).catch(() => {});
    await prisma.theater.deleteMany({}).catch(() => {});
    console.log('Cleared old theaters, screens, shows, seats, and bookings.');

    // 2. Ensure Verified User and 3 Theater Admins
    console.log('Creating Admin & Test User Accounts...');
    const userPass = await hashPassword('Password123!');
    const passPacific = await hashPassword('PacificCinema2026!');
    const passAmbience = await hashPassword('AmbienceCinema2026!');
    const passPalassio = await hashPassword('PalassioCinema2026!');

    const testUser = await prisma.user.upsert({
      where: { email: 'testuser@seatlock.com' },
      update: { name: 'Alex Vance', passwordHash: userPass, role: 'USER' },
      create: {
        email: 'testuser@seatlock.com',
        name: 'Alex Vance',
        passwordHash: userPass,
        role: 'USER',
      },
    });

    const adminPacific = await prisma.user.upsert({
      where: { email: 'admin.pacific@seatlock.com' },
      update: { name: 'Admin Pacific Mall', passwordHash: passPacific, role: 'ADMIN' },
      create: {
        email: 'admin.pacific@seatlock.com',
        name: 'Admin Pacific Mall',
        passwordHash: passPacific,
        role: 'ADMIN',
      },
    });

    const adminAmbience = await prisma.user.upsert({
      where: { email: 'admin.ambience@seatlock.com' },
      update: { name: 'Admin Ambience Mall', passwordHash: passAmbience, role: 'ADMIN' },
      create: {
        email: 'admin.ambience@seatlock.com',
        name: 'Admin Ambience Mall',
        passwordHash: passAmbience,
        role: 'ADMIN',
      },
    });

    const adminPalassio = await prisma.user.upsert({
      where: { email: 'admin.palassio@seatlock.com' },
      update: { name: 'Admin Phoenix Palassio', passwordHash: passPalassio, role: 'ADMIN' },
      create: {
        email: 'admin.palassio@seatlock.com',
        name: 'Admin Phoenix Palassio',
        passwordHash: passPalassio,
        role: 'ADMIN',
      },
    });
    console.log('✓ Users & 3 Admins ready.');

    // 3. Seed High-Definition Blockbuster Movies
    const moviesData = [
      {
        title: 'Interstellar: The IMAX Experience',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival across the cosmos.',
        durationMin: 169,
        language: 'English',
        genre: 'Sci-Fi / Space Epic',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210356/seatlock/trailers/u3ztl5w3ihf1gl5xlutr.mp4',
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
        trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210947/posters/wgpea8bwp5whndq7wusa.mp4',
        releaseDate: new Date('2026-10-20'),
        isActive: true,
      },
      {
        title: 'The Dark Knight (Remastered 70mm)',
        description: 'When the menace known as the Joker wreaks havoc and chaos on Gotham, Batman must accept one of the greatest tests of his ability to fight injustice.',
        durationMin: 152,
        language: 'English',
        genre: 'Action / Crime',
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
        trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210445/seatlock/trailers/nrjpg8jzawvtdyqdrziv.mp4',
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
        trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210647/seatlock/trailers/yuokkwsbzx1ds8ectiqc.mp4',
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
        trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210356/seatlock/trailers/u3ztl5w3ihf1gl5xlutr.mp4',
        releaseDate: new Date('2026-11-15'),
        isActive: true,
      }
    ];

    const seededMovies = [];
    for (const m of moviesData) {
      let existing = await prisma.movie.findFirst({ where: { title: m.title } });
      if (existing) {
        existing = await prisma.movie.update({ where: { id: existing.id }, data: m });
        seededMovies.push(existing);
      } else {
        const created = await prisma.movie.create({ data: m });
        seededMovies.push(created);
      }
    }
    console.log(`✓ Seeded ${seededMovies.length} movies.`);

    // 4. Seed the 3 Real Theaters and Screens
    const theatersData = [
      {
        name: 'Lumière Grand CineLounge - Pacific Mall',
        city: 'Delhi NCR',
        address: 'Level 4, Subhash Nagar, Pacific Mall',
        state: 'Delhi',
        screenName: 'Auditorium 01 (Dolby Atmos 4K Laser)',
      },
      {
        name: 'PVR Directors Cut - Ambience Mall',
        city: 'Gurugram',
        address: 'Level 3, Ambience Mall, NH-8',
        state: 'Haryana',
        screenName: 'Screen 01 (Gold Class VIP)',
      },
      {
        name: 'Inox Megaplex - Phoenix Palassio',
        city: 'Lucknow',
        address: 'Sector 7, Amar Shaheed Path, Gomti Nagar',
        state: 'Uttar Pradesh',
        screenName: 'IMAX Laser Screen 01',
      },
    ];

    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const now = new Date();

    for (const t of theatersData) {
      const theater = await prisma.theater.create({
        data: {
          name: t.name,
          city: t.city,
          address: t.address,
          state: t.state,
          isActive: true,
        },
      });
      console.log(`✓ Created Theater: ${theater.name} (${theater.city})`);

      const screen = await prisma.screen.create({
        data: {
          theaterId: theater.id,
          name: t.screenName,
          totalSeats: 60,
          isActive: true,
        },
      });

      // Create seats: A-F, 1-10
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
      const allSeats = await prisma.seat.findMany({ where: { screenId: screen.id } });

      // Create shows for today & tomorrow
      for (let i = 0; i < seededMovies.length; i++) {
        const movie = seededMovies[i];
        for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
          const showStartTime = new Date(now.getTime() + (dayOffset * 24 + 2 + i * 2.5) * 60 * 60 * 1000);
          const showEndTime = new Date(showStartTime.getTime() + movie.durationMin * 60 * 1000);

          const show = await prisma.show.create({
            data: {
              movieId: movie.id,
              screenId: screen.id,
              startTime: showStartTime,
              endTime: showEndTime,
              language: movie.language,
              basePrice: 350.00,
              isActive: true,
            },
          });

          // Create show seats
          const showSeats = allSeats.map(s => {
            let price = 350;
            if (s.seatType === 'PREMIUM') price = 480;
            if (s.seatType === 'RECLINER') price = 650;
            return {
              showId: show.id,
              seatId: s.id,
              status: 'AVAILABLE',
              price,
              version: 0,
            };
          });
          await prisma.showSeat.createMany({ data: showSeats });
        }
      }
      console.log(`✓ Configured ${screen.name} with 60 seats & 15 scheduled shows.`);
    }

    console.log('\n=============================================================');
    console.log('🎉 3 REAL THEATERS, SCREENS, SEATS & SHOWS SEEDED SUCCESSFULLY!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRealTheaters();

export { seedRealTheaters };
export default seedRealTheaters;


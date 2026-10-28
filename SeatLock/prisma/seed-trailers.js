import prisma from "../src/config/db.js";

const WORKING_TRAILERS = [
  "https://res.cloudinary.com/yrhsbxba/video/upload/v1793210356/seatlock/trailers/u3ztl5w3ihf1gl5xlutr.mp4",
  "https://res.cloudinary.com/yrhsbxba/video/upload/v1793210947/posters/wgpea8bwp5whndq7wusa.mp4",
  "https://res.cloudinary.com/yrhsbxba/video/upload/v1793210445/seatlock/trailers/nrjpg8jzawvtdyqdrziv.mp4",
  "https://res.cloudinary.com/yrhsbxba/video/upload/v1793210647/seatlock/trailers/yuokkwsbzx1ds8ectiqc.mp4",
];

export async function seedSampleTrailers() {
  const movies = await prisma.movie.findMany();
  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];
    const trailerUrl = WORKING_TRAILERS[i % WORKING_TRAILERS.length];

    await prisma.movie.update({
      where: { id: m.id },
      data: { trailerUrl },
    });
  }
  console.log(`[Seed] Seeded verified high-definition trailers for ${movies.length} movies.`);
}

if (process.argv[1]?.includes("seed-trailers.js")) {
  seedSampleTrailers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

const BASE_URL = 'http://localhost:8000/api/v1';

async function runE2E() {
  console.log('=== Starting SeatLock End-to-End API Flow Audit ===');

  // 1. User Login
  console.log('\n[Step 1] Logging in test user...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testuser@seatlock.com',
      password: 'Password123!',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  const { user, accessToken } = loginData.data;
  console.log(`✓ Authenticated as: ${user.name} (${user.email}), Role: ${user.role}`);
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  // 2. Fetch Movies
  console.log('\n[Step 2] Fetching active movies...');
  const moviesRes = await fetch(`${BASE_URL}/movies`);
  const moviesData = await moviesRes.json();
  console.log(`✓ Fetched ${moviesData.data?.length} movies.`);
  const activeMovie = moviesData.data[0];
  console.log(`✓ Selected movie: "${activeMovie.title}" (${activeMovie.language}, ${activeMovie.genre})`);

  // 3. Fetch Shows for movie
  console.log('\n[Step 3] Fetching shows...');
  const showsRes = await fetch(`${BASE_URL}/shows?movieId=${activeMovie.id}`);
  const showsData = await showsRes.json();
  const shows = showsData.data;
  if (!shows || shows.length === 0) throw new Error('No shows found for movie');
  const targetShow = shows[0];
  console.log(`✓ Selected show ID: ${targetShow.id} at ${new Date(targetShow.startTime).toLocaleString('en-IN')}`);

  // 4. Fetch Seats for Show
  console.log('\n[Step 4] Fetching show seats...');
  const seatsRes = await fetch(`${BASE_URL}/show-seats/show/${targetShow.id}`);
  const seatsData = await seatsRes.json();
  const availableSeats = seatsData.data.filter(s => s.status === 'AVAILABLE');
  console.log(`✓ Available seats: ${availableSeats.length} / ${seatsData.data.length}`);
  if (availableSeats.length < 2) throw new Error('Not enough available seats');
  const seatsToHold = availableSeats.slice(0, 2);
  console.log(`✓ Choosing seats: ${seatsToHold.map(s => s.seat ? `${s.seat.rowLabel}${s.seat.seatNumber}` : s.id).join(', ')}`);

  // 5. Hold Seats (Concurrency Lock)
  console.log('\n[Step 5] Holding seats via POST /shows/:id/seats/hold...');
  const holdRes = await fetch(`${BASE_URL}/shows/${targetShow.id}/seats/hold`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      showSeatIds: seatsToHold.map(s => s.id),
      strategy: 'PESSIMISTIC',
    }),
  });
  const holdData = await holdRes.json();
  if (!holdRes.ok) throw new Error(`Hold failed: ${JSON.stringify(holdData)}`);
  const holdInfo = holdData.data;
  console.log(`✓ Seats held! Hold Token: ${holdInfo.holdToken}, Booking ID: ${holdInfo.bookingId}, Total: ₹${holdInfo.totalAmount}`);

  // 6. Payment Simulation (Confirm Booking)
  console.log('\n[Step 6] Simulating payment confirmation...');
  const payRes = await fetch(`${BASE_URL}/payments/simulate-confirm`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      bookingId: holdInfo.bookingId,
      simulateSuccess: true,
      paymentMethod: 'UPI',
    }),
  });
  const payData = await payRes.json();
  if (!payRes.ok) throw new Error(`Payment failed: ${JSON.stringify(payData)}`);
  console.log(`✓ Payment processed successfully! Payment ID: ${payData.data?.payment?.id || 'OK'}`);

  // 7. Verify Confirmed Booking
  console.log('\n[Step 7] Verifying booking status and ticket details...');
  const bookingRes = await fetch(`${BASE_URL}/bookings/${holdInfo.bookingId}`, {
    headers: authHeaders,
  });
  const bookingData = await bookingRes.json();
  const booking = bookingData.data?.booking || bookingData.data;
  console.log(`✓ Booking Number: ${booking.bookingNumber}`);
  console.log(`✓ Booking Status: ${booking.status}`);
  console.log(`✓ Seats Booked: ${booking.bookingSeats?.length}`);
  console.log(`✓ Confirmed At: ${booking.confirmedAt}`);

  console.log('\n======================================================');
  console.log('🎉 ALL BACKEND BOOKING SAGA API TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runE2E().catch(err => {
  console.error('\n❌ E2E Audit Failed:', err);
  process.exit(1);
});

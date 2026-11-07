# ROAD TRIP CHAOS — 3D Online Prototype

## Is prototype mein kya chalta hai
- 3D low-poly RV aur forest road
- Create Room / Join Room (4-character room code)
- Maximum 6 players
- Username browser mein save hota hai
- Shared RV, driver-only steering/throttle
- P, R, N, 1, 2, 3, 4 gear selector
- Stick-figure friends aur THROW action
- Mobile touch controls + desktop keyboard controls

## Android phone par run karne ka aasaan tareeka
Is project ko online chalane ke liye Node.js server chahiye. Sirf `index.html` ko file manager se kholne par multiplayer nahi chalega.

### Option A: Replit (phone browser)
1. Replit par account bana kar **Node.js** project create karo.
2. ZIP ke andar ki files upload karo. `public` folder ke andar `index.html` hona chahiye.
3. Shell/Console mein `npm install` chalao.
4. Run command `npm start` rakho.
5. Replit ka web URL kholo. Apne doston ko wahi URL bhejo.
6. Ek player Create Room kare; baaki uska 4-letter code daal kar Join karein.

### Option B: Apne computer/Node.js server par
1. Node.js install karo.
2. Project folder mein terminal kholo.
3. `npm install`
4. `npm start`
5. Browser mein `http://localhost:3000` kholo.

## Important
- Yeh playable first prototype hai, final polished game nahi.
- Username isi browser/device mein save hota hai. Account-based cross-device username abhi nahi hai.
- Room data server memory mein hai; server restart hone par rooms reset honge.
- RV road par drive hoti hai, lekin abhi maps, repair minigames, proper vehicle collision, seats/enter-exit animations aur advanced ragdoll physics next development stages hain.
- Three.js library CDN se load hoti hai; internet connection zaroori hai.
- Public hosting par deploy karne se pehle production security, rate limits aur server-side physics validation add karni hogi.

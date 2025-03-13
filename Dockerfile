# Gunakan image Node.js sebagai base image
FROM node:18 # Ganti 18 dengan versi Node.js yang Anda gunakan

# Instal pustaka sistem operasi yang diperlukan
RUN apt-get update && apt-get install -y libnss3

# Buat direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Instal dependensi Node.js
RUN npm install --omit=dev # Gunakan --omit=dev sebagai pengganti --production

# Salin semua file proyek ke dalam container
COPY . .

# Jalankan aplikasi Anda
CMD ["npm", "start"]

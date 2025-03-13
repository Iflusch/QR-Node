        function updateClock() {
            document.getElementById('clock').innerText = new Date().toLocaleTimeString();
        }
        setInterval(updateClock, 1000);
        updateClock();


        function tampilkanHalaman2() {
            document.getElementById('statusLabel').innerText = "Status anda akan muncul di sini";
            document.getElementById('halaman1').classList.add('hidden');
            document.getElementById('halaman2').classList.remove('hidden');
            
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('qrcode').classList.add('hidden'); 

            const { startPayment } = window.electron;
            startPayment();

            setTimeout(() => {
                const qrCodeURL = 'qrcode.png'; 
                document.getElementById('qrcode').src = qrCodeURL;
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('qrcode').classList.remove('hidden'); 
            }, 3000); 
        }

        function cekStatus() {
            if (window.electron) {
                window.electron.cekStatus().then((lastLines) => {
                    const jsonResponse = {
                        status: 'success',
                        data: lastLines
                    };
                    console.log(JSON.stringify(jsonResponse, null, 2));
                    
                }).catch((error) => {
                    console.error("Error saat mengambil data log:", error);
                });
            } else {
                console.error("Electron bridge tidak ditemukan!");
            }
        }

        document.getElementById('btnCekStatus').addEventListener('click', cekStatus);

        function tampilkanHalaman1() {
            document.getElementById('halaman2').classList.add('hidden');
            document.getElementById('halaman3').classList.add('hidden');
            document.getElementById('halaman1').classList.remove('hidden');
        }

        function tampilkanHalaman3() {
            document.getElementById('halaman1').classList.add('hidden');
            document.getElementById('halaman2').classList.add('hidden');
            document.getElementById('halaman3').classList.remove('hidden');
        }

        function bukaDSLRBooth() {
            if (window.electron) {
                window.electron.bukaDSLRBooth();
                setTimeout(function() {
                    tampilkanHalaman1();
                }, 2000); 
            } else {
                console.error("Electron bridge tidak ditemukan!");
            }
        }

        window.electron.onTampilkanHalaman3(() => {
            tampilkanHalaman3();
        });

        window.electron.onTampilkanPending(() => {
            document.getElementById('statusLabel').innerText = "Pending, Coba Lagi";
            document.getElementById('statusLabel').classList.remove('hidden'); // Pastikan status label terlihat
        });

        window.electron.onTampilkanExpire(() => {
            tampilkanHalaman2();
            document.getElementById('statusLabel').innerText = "QR expired, Coba Lagi";
        });


        function tutupHalaman() {
            window.close(); 
        }

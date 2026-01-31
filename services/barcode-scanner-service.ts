/**
 * Servicio de escaneo de códigos de barras para webapp
 * Usa la API de cámara del navegador y la librería QuaggaJS
 */

export interface BarcodeResult {
  code: string;
  format: string;
  timestamp: Date;
}

export interface BarcodeScannerOptions {
  onDetected?: (result: BarcodeResult) => void;
  onError?: (error: Error) => void;
  formats?: string[];
}

const QUAGGA_CDN = 'https://unpkg.com/@ericblade/quagga2@1.8.4/dist/quagga.min.js';

class BarcodeScannerService {
  private quagga: any = null;
  private isInitialized = false;
  private isScanning = false;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;

  /**
   * Cargar la librería QuaggaJS dinámicamente
   */
  async loadQuagga(): Promise<void> {
    if (this.quagga) return;

    return new Promise((resolve, reject) => {
      // Verificar si ya está cargado
      if ((window as any).Quagga) {
        this.quagga = (window as any).Quagga;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = QUAGGA_CDN;
      script.onload = () => {
        this.quagga = (window as any).Quagga;
        resolve();
      };
      script.onerror = () => reject(new Error('Error cargando QuaggaJS'));
      document.head.appendChild(script);
    });
  }

  /**
   * Iniciar el escáner de códigos de barras
   */
  async startScanner(
    targetElement: HTMLElement,
    options: BarcodeScannerOptions = {}
  ): Promise<void> {
    if (this.isScanning) {
      console.warn('[BarcodeScanner] El escáner ya está activo');
      return;
    }

    try {
      await this.loadQuagga();

      const formats = options.formats || [
        'ean_reader',
        'ean_8_reader',
        'code_128_reader',
        'code_39_reader',
        'upc_reader',
        'upc_e_reader',
      ];

      await new Promise<void>((resolve, reject) => {
        this.quagga.init({
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: targetElement,
            constraints: {
              width: { min: 640 },
              height: { min: 480 },
              facingMode: 'environment', // Cámara trasera
            },
          },
          locator: {
            patchSize: 'medium',
            halfSample: true,
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          decoder: {
            readers: formats,
          },
          locate: true,
        }, (err: unknown) => {
          if (err) {
            reject(new Error(`Error iniciando escáner: ${err.message || err}`));
            return;
          }
          resolve();
        });
      });

      // Configurar callback de detección
      this.quagga.onDetected((result: any) => {
        if (result && result.codeResult && result.codeResult.code) {
          const barcodeResult: BarcodeResult = {
            code: result.codeResult.code,
            format: result.codeResult.format,
            timestamp: new Date(),
          };

          // Reproducir sonido de confirmación
          this.playBeep();

          if (options.onDetected) {
            options.onDetected(barcodeResult);
          }
        }
      });

      // Iniciar escaneo
      this.quagga.start();
      this.isScanning = true;
      this.isInitialized = true;

    } catch (error) {
      if (options.onError) {
        options.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Detener el escáner
   */
  stopScanner(): void {
    if (!this.isScanning || !this.quagga) return;

    try {
      this.quagga.stop();
      this.isScanning = false;
    } catch (error) {
    }
  }

  /**
   * Verificar si el navegador soporta acceso a la cámara
   */
  async checkCameraSupport(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtener lista de cámaras disponibles
   */
  async getCameras(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }

  /**
   * Escanear código de barras desde una imagen
   */
  async scanFromImage(imageUrl: string): Promise<BarcodeResult | null> {
    await this.loadQuagga();

    return new Promise((resolve) => {
      this.quagga.decodeSingle({
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader',
          ],
        },
        locate: true,
        src: imageUrl,
      }, (result: any) => {
        if (result && result.codeResult && result.codeResult.code) {
          resolve({
            code: result.codeResult.code,
            format: result.codeResult.format,
            timestamp: new Date(),
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Reproducir sonido de confirmación
   */
  private playBeep(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 100);
    } catch (error) {
      // Ignorar errores de audio
    }
  }

  /**
   * Verificar si el escáner está activo
   */
  isActive(): boolean {
    return this.isScanning;
  }
}

export const barcodeScannerService = new BarcodeScannerService();
export default barcodeScannerService;

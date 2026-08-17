import multer from "multer";
import path from "path";
import fs from "fs";

// Generic folder creator
function createStorage(folderName: string) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "..", "..", "uploads", folderName);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });
  // return multer({ storage });
  return multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 },  // 1 MB limit
    });
}

export const uploadVehicleImg = createStorage("vehicleImg");
export const uploadSignature = createStorage("signature");
export const uploadCompanyLogo = createStorage("companyLogo");

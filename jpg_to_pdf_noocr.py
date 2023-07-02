import os
import glob
from PIL import Image
from fpdf import FPDF
from PyPDF2 import PdfMerger

def convert_images_to_pdf(image_folder, pdf_filename):
    # Find all .jpg files in the folder
    print(f"Sorting images in folder {image_folder}...")
    images = sorted(glob.glob(os.path.join(image_folder, "*.jpg")))

    # Create a PdfMerger object
    merger = PdfMerger()

    for image_path in images:
        # Open image with PIL
        image = Image.open(image_path)

        # Check if the image file has 'dpi' information
        if 'dpi' in image.info:
            dpi = image.info['dpi'][0]  # Assuming horizontal and vertical DPI are the same
        else:
            dpi = 96  # Use a default DPI if it's not available

        print(f"Processing {image_path} with DPI={dpi}...")

        # Convert image size to points (1 point = 1/72 inches)
        image_width_pt = image.width * 72 / dpi
        image_height_pt = image.height * 72 / dpi

        # Create a FPDF object with the size of the image
        pdf = FPDF(unit="pt", format=(image_width_pt, image_height_pt))

        # Add a page to the PDF document
        pdf.add_page()

        # Add the image to the page
        pdf.image(image_path, 0, 0, image_width_pt, image_height_pt)

        # Save the PDF to a temporary file
        temp_pdf_filename = "temp_" + os.path.basename(image_path) + ".pdf"
        pdf.output(temp_pdf_filename)

        # Add the temporary PDF to the merger
        merger.append(temp_pdf_filename)

    # Write the merged PDF to a file
    print(f"Merging all PDFs as {pdf_filename}...")

    merger.write(pdf_filename)
    merger.close()

    # Delete the temporary PDFs
    print(f"Housekeeping...")
    for pdf in glob.glob("temp_*.pdf"):
        os.remove(pdf)
    print(f"Done!")

# Convert all images in 'images' folder to 'output.pdf'
convert_images_to_pdf('Module', 'output.pdf')

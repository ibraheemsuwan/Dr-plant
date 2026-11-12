# Source assets (not shipped)

Original, high-resolution photos kept for the team. They are **not** in `public/`, so they are not copied into
the website build (they added about 31 MB to every deploy).

- `crops/`: the original crop pictures. The website shows the optimised copies stored in Cloudinary and referenced from
  the database (`crops.ImageUrl`); upload one of these from the admin dashboard (edit crop, choose a picture) to replace it.

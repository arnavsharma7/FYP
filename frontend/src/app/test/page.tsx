import PanoramaViewer from "@/components/PanoromaViewer";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-6 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          Nepal 360 Test View
        </h1>
        <p className="max-w-2xl text-sm text-stone-600">
          Sample equirectangular panorama of Kathmandu Valley for testing the 3D
          viewer route.
        </p>
      </div>
      <PanoramaViewer
        title="Kathmandu Valley 360 Preview"
        imageUrl="https://upload.wikimedia.org/wikipedia/commons/9/99/Panorama_of_Pashupatinath.jpg"
      />
    </main>
  );
}

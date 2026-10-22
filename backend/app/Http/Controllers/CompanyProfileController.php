<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CompanyProfile;
use App\Models\Service;
use App\Models\Event;
use Illuminate\Support\Facades\Storage;

class CompanyProfileController extends Controller
{
    public function getPublicData()
    {
        $profile = CompanyProfile::firstOrCreate(['id' => 1]);
        $services = Service::all();
        $events = Event::where('status', 'Diterbitkan')->orderBy('date', 'desc')->take(5)->get();

        return response()->json([
            'profile' => $profile,
            'services' => $services,
            'events' => $events
        ]);
    }

    public function updateLandingPage(Request $request)
    {
        try {
            $profile = CompanyProfile::firstOrCreate(['id' => 1]);
            $data = [];

            // LOGIKA BARU: Hanya masukkan ke array update JIKA user mengisi datanya
            if ($request->filled('hero_title')) $data['hero_title'] = $request->hero_title;
            if ($request->filled('hero_subtitle')) $data['hero_subtitle'] = $request->hero_subtitle;
            if ($request->filled('btn_text')) $data['btn_text'] = $request->btn_text;

            if ($request->has('remove_image') && $request->remove_image == 'true') {
                if ($profile->hero_image) Storage::disk('public')->delete($profile->hero_image);
                $data['hero_image'] = null;
            }

            if ($request->hasFile('hero_image')) {
                if ($profile->hero_image) Storage::disk('public')->delete($profile->hero_image);
                $data['hero_image'] = $request->file('hero_image')->store('company_profile/hero', 'public');
            }

            if (!empty($data)) {
                $profile->update($data);
            }

            return response()->json(['status' => 'success', 'message' => 'Landing Page diperbarui', 'data' => $profile]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Error Server: ' . $e->getMessage()], 500);
        }
    }

    public function updateContact(Request $request)
    {
        try {
            $profile = CompanyProfile::firstOrCreate(['id' => 1]);
            $data = [];

            // LOGIKA BARU: Sama seperti Landing Page, perbarui kolom yang diisi saja
            $fields = ['email', 'phone', 'website', 'address', 'operasional_senin_jumat', 'operasional_sabtu', 'operasional_minggu'];
            foreach ($fields as $field) {
                if ($request->filled($field)) {
                    $data[$field] = $request->$field;
                }
            }

            if (!empty($data)) {
                $profile->update($data);
            }

            return response()->json(['message' => 'Kontak & Jam Operasional diperbarui', 'data' => $profile]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error Server: ' . $e->getMessage()], 500);
        }
    }

    // ==========================================
    // CRUD LAYANAN
    // ==========================================
    public function getServices() {
        return response()->json(Service::all());
    }

    public function storeService(Request $request) {
        $data = $request->except('image');
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('company_profile/services', 'public');
        }
        $service = Service::create($data);
        return response()->json(['message' => 'Layanan ditambahkan', 'data' => $service]);
    }

    public function destroyService($id) {
        $service = Service::findOrFail($id);
        if ($service->image) Storage::disk('public')->delete($service->image);
        $service->delete();
        return response()->json(['message' => 'Layanan dihapus']);
    }

    // ==========================================
    // CRUD EVENT
    // ==========================================
    public function getEvents() {
        return response()->json(Event::orderBy('date', 'desc')->get());
    }

    public function storeEvent(Request $request) {
        $data = $request->except('image');
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('company_profile/events', 'public');
        }
        $event = Event::create($data);
        return response()->json(['message' => 'Event ditambahkan', 'data' => $event]);
    }

    public function destroyEvent($id) {
        $event = Event::findOrFail($id);
        if ($event->image) Storage::disk('public')->delete($event->image);
        $event->delete();
        return response()->json(['message' => 'Event dihapus']);
    }
}

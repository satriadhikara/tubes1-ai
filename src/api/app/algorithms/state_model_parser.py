from .state import Problem, KelasMataKuliah, Ruangan, KuliahMahasiswa, JadwalKuliah


def load_problem(data):
    list_kelas = [KelasMataKuliah(**k.dict()) for k in data.kelas_mata_kuliah]
    list_ruangan = [Ruangan(**r.dict()) for r in data.ruangan]
    list_kuliah_mahasiswa = []
    for m in data.mahasiswa:
        if len(m.prioritas) != len(m.daftar_mk):
            raise ValueError(f"Prioritas mahasiswa NIM {m.nim} tidak valid")
        if len(set(m.prioritas)) != len(m.prioritas):
            raise ValueError(
                f"Prioritas mahasiswa NIM {m.nim} harus unik untuk setiap mata kuliah"
            )

        list_kuliah_mahasiswa.append(
            KuliahMahasiswa(
                nim=m.nim,
                prio_mata_kuliah={
                    prio: kode for prio, kode in zip(m.prioritas, m.daftar_mk)
                },
            )
        )

    return Problem(
        list_kelas=list_kelas,
        list_ruangan=list_ruangan,
        list_kuliah_mahasiswa=list_kuliah_mahasiswa,
    )

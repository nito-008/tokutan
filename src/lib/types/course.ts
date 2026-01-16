// kdbから取得した科目データ
export interface KdbCourse {
  科目番号: string;
  科目名: string;
  授業方法: string;
  単位数: string;
  標準履修年次: string;
  実施学期: string;
  曜時限: string;
  担当教員: string;
  授業概要: string;
  備考: string;
  データ更新日: string;
}

// 内部形式の科目データ
export interface Course {
  id: string;
  name: string;
  method: string;
  credits: number;
  gradeYear: number;
  semester: string;
  schedule: string;
  instructor: string;
  description: string;
  notes: string;
  updatedAt: string;
  cachedAt?: string;
}

// kdbデータを内部形式に変換
export function convertKdbCourse(kdb: KdbCourse): Course {
  return {
    id: kdb.科目番号,
    name: kdb.科目名,
    method: kdb.授業方法,
    credits: parseFloat(kdb.単位数) || 0,
    gradeYear: parseInt(kdb.標準履修年次) || 0,
    semester: kdb.実施学期,
    schedule: kdb.曜時限,
    instructor: kdb.担当教員,
    description: kdb.授業概要,
    notes: kdb.備考,
    updatedAt: kdb.データ更新日
  };
}

-- notices 테이블에 이미지 URL 배열 컬럼 추가
ALTER TABLE notices ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- notice-images Storage 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('notice-images', 'notice-images', true)
ON CONFLICT (id) DO NOTHING;

-- 누구나 이미지 조회 가능
DO $$ BEGIN
  CREATE POLICY "notice_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notice-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 누구나 이미지 업로드 가능 (관리자 화면에서만 접근하도록 UI에서 제어)
DO $$ BEGIN
  CREATE POLICY "notice_images_anon_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'notice-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

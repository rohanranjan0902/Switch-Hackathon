#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import wave

BASE_DIR = "/home/devcontainers/Projects/Active/Switch-Hacka"
RAW_DIR = os.path.join(BASE_DIR, "submission/demo/RAW_RECORDINGS")
ASSETS_DIR = os.path.join(BASE_DIR, "submission/demo/VIDEO_ASSETS")
EDIT_DIR = os.path.join(BASE_DIR, "submission/demo/EDITING_SOURCE")
SUBTITLES_FILE = os.path.join(BASE_DIR, "submission/demo/SUBTITLES/subtitles.srt")
FINAL_MP4 = os.path.join(BASE_DIR, "submission/demo/FINAL_DEMO.mp4")

os.makedirs(EDIT_DIR, exist_ok=True)

SCENES = [
    {
        "id": "scene01",
        "name": "Cinematic Opening",
        "video": os.path.join(RAW_DIR, "scene01_opening.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene01.wav"),
        "target_dur": 20.0
    },
    {
        "id": "scene02",
        "name": "The Real-World Problem",
        "video": os.path.join(RAW_DIR, "scene02_problem.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene02.wav"),
        "target_dur": 25.0
    },
    {
        "id": "scene03",
        "name": "Command Center Cockpit",
        "video": os.path.join(RAW_DIR, "scene03_cockpit.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene03.wav"),
        "target_dur": 35.0
    },
    {
        "id": "scene04",
        "name": "Switch and Agent Orchestration",
        "video": os.path.join(RAW_DIR, "scene04_switch.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene04.wav"),
        "target_dur": 35.0
    },
    {
        "id": "scene05",
        "name": "Telegram War Room",
        "video": os.path.join(RAW_DIR, "scene05_telegram.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene05.wav"),
        "target_dur": 55.0
    },
    {
        "id": "scene06",
        "name": "Code Fixer and Code Review",
        "video": os.path.join(RAW_DIR, "scene06_codereview.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene06.wav"),
        "target_dur": 35.0
    },
    {
        "id": "scene07",
        "name": "Testing and Verification",
        "video": os.path.join(RAW_DIR, "scene07_testing.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene07.wav"),
        "target_dur": 30.0
    },
    {
        "id": "scene08",
        "name": "Human Sign-Off and Resolution",
        "video": os.path.join(RAW_DIR, "scene08_signoff.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene08.wav"),
        "target_dur": 30.0
    },
    {
        "id": "scene09",
        "name": "Architecture and Product Value",
        "video": os.path.join(RAW_DIR, "scene09_architecture.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene09.wav"),
        "target_dur": 25.0
    },
    {
        "id": "scene10",
        "name": "Final Closing",
        "video": os.path.join(RAW_DIR, "scene10_closing.mp4"),
        "audio": os.path.join(ASSETS_DIR, "narration_scene10.wav"),
        "target_dur": 15.0
    }
]

def run(cmd):
    print(f"[EXEC] {cmd}")
    res = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"[ERROR] Command failed with code {res.returncode}:\n{res.stderr}")
        sys.exit(1)
    return res.stdout

def get_duration(filepath):
    cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{filepath}\""
    out = run(cmd).strip()
    return float(out)

def main():
    print("==================================================")
    print("STEP 1: Processing & Synchronizing Individual Scenes")
    print("==================================================")

    processed_scenes = []
    concat_list_path = os.path.join(EDIT_DIR, "scenes_list.txt")

    with open(concat_list_path, "w") as f_list:
        for i, sc in enumerate(SCENES, 1):
            sc_id = sc["id"]
            video_file = sc["video"]
            audio_file = sc["audio"]
            out_file = os.path.join(EDIT_DIR, f"{sc_id}_synced.mp4")

            audio_dur = get_duration(audio_file)
            video_dur = get_duration(video_file)

            print(f"\nProcessing {sc_id} ({sc['name']}):")
            print(f"  Audio Duration: {audio_dur:.2f}s | Raw Video Duration: {video_dur:.2f}s")

            # In case raw video was very short (like single-frame captures), loop it
            if video_dur < 1.0:
                # Loop video to match audio
                cmd = (
                    f"ffmpeg -y -stream_loop -1 -i \"{video_file}\" -i \"{audio_file}\" "
                    f"-map 0:v -map 1:a -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 "
                    f"-c:a aac -b:a 192k -ar 48000 -ac 2 -t {audio_dur:.2f} \"{out_file}\""
                )
            else:
                # Scale presentation timestamps so visual events naturally unfold over the full voiceover duration
                scale_factor = audio_dur / video_dur
                cmd = (
                    f"ffmpeg -y -i \"{video_file}\" -i \"{audio_file}\" "
                    f"-filter_complex \"[0:v]setpts={scale_factor:.6f}*PTS,fps=30,scale=1920:1080[v]\" "
                    f"-map \"[v]\" -map 1:a -c:v libx264 -preset fast -pix_fmt yuv420p "
                    f"-c:a aac -b:a 192k -ar 48000 -ac 2 -t {audio_dur:.2f} \"{out_file}\""
                )

            run(cmd)
            processed_scenes.append(out_file)
            f_list.write(f"file '{out_file}'\n")

    print("\n==================================================")
    print("STEP 2: Concatenating Scenes")
    print("==================================================")
    raw_concat = os.path.join(EDIT_DIR, "raw_concat.mp4")
    run(f"ffmpeg -y -f concat -safe 0 -i \"{concat_list_path}\" -c copy \"{raw_concat}\"")

    total_dur = get_duration(raw_concat)
    print(f"Total video duration: {total_dur:.2f} seconds ({total_dur/60:.2f} minutes)")

    print("\n==================================================")
    print("STEP 3: Synthesizing Ambient Cinematic Background Music")
    print("==================================================")
    # Generate a subtle, warm, mellow drone/synth pad at 60Hz and 120Hz with soft harmonics, volume -22dB
    ambient_music = os.path.join(EDIT_DIR, "ambient_bed.wav")
    run(
        f"ffmpeg -y -f lavfi -i \"sine=frequency=65:duration={total_dur:.2f}\" "
        f"-f lavfi -i \"sine=frequency=130:duration={total_dur:.2f}\" "
        f"-f lavfi -i \"sine=frequency=196:duration={total_dur:.2f}\" "
        f"-filter_complex \"[0:a][1:a][2:a]amix=inputs=3:weights=0.5 0.3 0.2,lowpass=f=400,volume=0.08,afade=t=in:ss=0:d=3,afade=t=out:st={total_dur-4:.2f}:d=4[bg]\" "
        f"-map \"[bg]\" -c:a pcm_s16le -ar 48000 -ac 2 \"{ambient_music}\""
    )

    print("\n==================================================")
    print("STEP 4: Mixing Narration with Background Music")
    print("==================================================")
    mixed_audio = os.path.join(EDIT_DIR, "mixed_audio.wav")
    run(
        f"ffmpeg -y -i \"{raw_concat}\" -i \"{ambient_music}\" "
        f"-filter_complex \"[0:a]volume=1.0[voice];[1:a]volume=0.15[bed];[voice][bed]amix=inputs=2:duration=first[outa]\" "
        f"-map \"[outa]\" -c:a pcm_s16le -ar 48000 -ac 2 \"{mixed_audio}\""
    )

    print("\n==================================================")
    print("STEP 5: Burning Subtitles & Exporting Final MP4")
    print("==================================================")
    # Subtitle style: clean sans-serif font, white text with dark translucent outline, bottom centered
    sub_filter = (
        f"subtitles='{SUBTITLES_FILE}':force_style='FontName=DejaVu Sans,FontSize=20,PrimaryColour=&H00FFFFFF,"
        f"OutlineColour=&H80000000,BackColour=&H60000000,BorderStyle=4,Outline=1,Shadow=0,Alignment=2,MarginV=42'"
    )

    run(
        f"ffmpeg -y -i \"{raw_concat}\" -i \"{mixed_audio}\" "
        f"-filter_complex \"[0:v]{sub_filter}[v]\" "
        f"-map \"[v]\" -map 1:a "
        f"-c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r 30 "
        f"-c:a aac -b:a 192k -ar 48000 -ac 2 "
        f"\"{FINAL_MP4}\""
    )

    print("\n==================================================")
    print("FINAL EXPORT COMPLETE!")
    print(f"Destination: {FINAL_MP4}")
    print("==================================================")

    # Validate with FFprobe
    validate_cmd = (
        f"ffprobe -v error -show_entries "
        f"format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,channels,sample_rate "
        f"-of json \"{FINAL_MP4}\""
    )
    probe_output = run(validate_cmd)
    print("\nFFPROBE VALIDATION REPORT:")
    print(probe_output)

if __name__ == "__main__":
    main()


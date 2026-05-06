import AVFoundation
import MediaPlayer
import Foundation

class MusicPlayer: ObservableObject {
    @Published var isPlaying = false
    @Published var currentSong: MPMediaItem?
    @Published var queue: [MPMediaItem] = []
    @Published var currentIndex = 0

    var player: AVAudioPlayer?

    func play(song: MPMediaItem) {
        guard let url = song.assetURL else { return }
        do {
            player = try AVAudioPlayer(contentsOf: url)
            player?.play()
            isPlaying = true
            currentSong = song
        } catch {
            print("Error playing song: \(error)")
        }
    }

    func pause() {
        player?.pause()
        isPlaying = false
    }

    func playNext() {
        guard currentIndex < queue.count - 1 else { return }
        currentIndex += 1
        play(song: queue[currentIndex])
    }

    func playPrevious() {
        guard currentIndex > 0 else { return }
        currentIndex -= 1
        play(song: queue[currentIndex])
    }

    func addToQueue(song: MPMediaItem) {
        queue.append(song)
    }

    func removeFromQueue(index: Int) {
        guard queue.indices.contains(index) else { return }
        queue.remove(at: index)

        if currentIndex >= queue.count {
            currentIndex = max(0, queue.count - 1)
        }
    }
}

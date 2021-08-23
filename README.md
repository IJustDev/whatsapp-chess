# WhatsApp Chess Bot

This WhatsApp bot will allow you to play chess directly in your chat.

## How does this work?
It's made possible by some great guys hooking into WhatsApp web. [Reverse
Engineer Repo][rev]

I've used [chess-base][chess-base] to validate a players move and
[chess-image-generator][chess-img-gen] to render each move.

## Usage
```sh
$ npm install
$ npm run start
```

Will show up an QR-Code on your terminal. You need to scan it like you would
with WhatsApp web.

After that the bot is active and you can use
```
# WhatsApp Chess

#new - starts a new game
#move a2a4 - moves the piece on field a2 to field a4
#status - display the current board and stats
#help - display this help prompt.
```
## Demo

<img src="https://pbs.twimg.com/media/E9dXRGAWYAY93e8?format=jpg&name=large" width="350px"/>

## But why?
WHO WOULDN'T LOVE TO PLAY CHESS ON HIS PHONE? But seriously, it was an
expirement how well bots could be integrated with WhatsApp and what they are
capable of.

Furtheremore the code is to be honest the worst piece I ever wrote. It will
require refactoring asap.

## Thank you
If you want to know more about those random projects, follow @IJustDev on
GitHub. Feel free to share this project or create merge requests, really
appreciate any kind of contribution.

[rev]: https://github.com/sigalor/whatsapp-web-reveng
[chess-base]: https://npm.io/package/chess-base
[chess-img-gen]: https://github.com/andyruwruw/chess-image-generator

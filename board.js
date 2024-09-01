class Carousel {
  
  constructor(element) {
    
    this.board = element
    this.onPan = this.onPan.bind(this)
    this.reveal = this.reveal.bind(this)
    this.movedCard = false
    this.data = [[]]
    this.knownWords = 0
    this.chapterNames = [
      ['8. Plánujeme víkend', '0'], 
      ['9. Lidské tělo', '1994253440'],
      ['10. Místo, kde bydlíme', '982386913'], 
      ['11. Na davolené', '1306385996'], 
      ['12. Tradiční svátky', '761681440'],
      ['13. Výmluvy a přání', '1148019362']]

    this.initBoard()

  }

  initBoard() {

    let dropdown= document.createElement('div')
    dropdown.classList.add('dropdown')
    board.appendChild(dropdown)

    let button = document.createElement('button')
    button.classList.add('dropbtn')
    dropdown.appendChild(button)
    button.textContent = 'Chapters'
    button.onclick = this.showOptions
    
    let chapters = document.createElement('div')
    chapters.classList.add('dropdown-content')
    chapters.id = "chapters"
    dropdown.appendChild(chapters)

    for (let i in this.chapterNames) {
      let chapter = document.createElement('p')
      chapter.classList.add('dropdown-content-element')
      chapter.textContent = this.chapterNames[i][0]
      chapter.addEventListener("click",() => this.addCards(this.chapterNames[i][1]))
      chapters.appendChild(chapter)
    }

    // add counter
    let counter= document.createElement('div')
    counter.classList.add('counter')
    board.appendChild(counter)

  }

  addCards(chapter) {

    this.getData(chapter).then((res) => {

      // set counter
      this.knownWords = 0
      this.board.querySelector('.counter').textContent  = '0/'+ res.length
      this.board.querySelector('.text').textContent = 'Great job. Get a treat.'
      this.showOptions()

      this.data = res
      let i = 0
      while (i < res.length) {

         // add new card to the deck
         let card = document.createElement('div')
         card.classList.add('card')

         let question = document.createElement('div')
         question.classList.add('cardText')
         question.textContent = res[i][0]
         card.appendChild(question)
 
         // add empty container for nope/like to the card
         // todo: avoid that pic is moving text
         let emotion = document.createElement('img') 
         card.appendChild(emotion)
 
         this.board.insertBefore(card, this.board.firstChild)

         i++

      }

      // handle gestures
      this.handle()

    })
  }
  
  handle() {
    
    // list all cards
    this.cards = this.board.querySelectorAll('.card')
    
    // get top card
    this.topCard = this.cards[this.cards.length-1]
    
    if (this.cards.length > 0) {

      // destroy previous Hammer instance, if present
      if (this.hammer) this.hammer.destroy()
      
      // listen for pan gesture on top card
      this.hammer = new Hammer(this.topCard)
      this.hammer.add(new Hammer.Pan({
        position: Hammer.position_ALL, threshold: 0
      }))

      // pass event data to custom callback
      this.hammer.on('pan', this.onPan)
      this.topCard.addEventListener("click", this.reveal)
      this.topCard.addEventListener("ontouchend", this.reveal)
    }
    
  }
  
  onPan(e) {

    this.movedCard = true

    if (!this.isPanning) {

      this.isPanning = true
      
      // remove transition property
      this.topCard.style.transition = null
      
      // get starting coordinates
      let style = window.getComputedStyle(this.topCard)
      let mx = style.transform.match(/^matrix\((.+)\)$/)
      this.startPosX = mx ? parseFloat(mx[1].split(', ')[4]) : 0
      this.startPosY = mx ? parseFloat(mx[1].split(', ')[5]) : 0

      // get card bounds
      let bounds = this.topCard.getBoundingClientRect()
    
      // get finger position, top (1) or bottom (-1) of the card
      this.isDraggingFrom = (e.center.y - bounds.top) > this.topCard.clientHeight / 2 ? -1 : 1

    }
    
    // get new coordinates
    let posX = e.deltaX + this.startPosX
    let posY = e.deltaY + this.startPosY

    // get ratio between swiped pixels and X axis
    let propX = e.deltaX / this.board.clientWidth
    
    // get swipe direction, left (-1) or right (1)
    let dirX = e.deltaX < 0 ? -1 : 1
    
    // get degrees of rotation (between 0 and +/- 45)
    let deg = this.isDraggingFrom * dirX * Math.abs(propX) * 45
    
    // move card
    this.topCard.style.transform = 'translateX(' + posX + 'px) translateY(' + posY + 'px) rotate(' + deg + 'deg)' 

    let image = this.topCard.querySelector("img")  

    // add nope when swiping left and like when swiping right
    if (dirX == -1){
      image.classList.remove('like')
      image.src = "images/Nope.png"
      image.classList.add('nope')
    } else if (dirX == 1) {
      image.classList.remove('nope')
      image.src = "images/Like.png"
      image.classList.add('like')
    }

    if (e.isFinal) {
  
      let successful = false

      // check threshold
      if (propX > 0.25) {
e
        successful = true
        // get right border position
        posX = document.body.clientWidth 

        //remove card and count known word 
        this.knownWords++
        this.board.querySelector('.counter').textContent = this.knownWords + '/' + this.data.length

      } else if (propX < -0.25) {

        successful = true
        // get left border position
        posX = - document.body.clientWidth 

        //add card again at the back
        let card = document.createElement('div')
        card.classList.add('card')

        let question = document.createElement('div')
        question.classList.add('cardText')

        let index = this.data.findIndex(arr => arr.includes(this.topCard.textContent))
        question.textContent = this.data[index][0]
        this.data[index][2] = 0
        card.appendChild(question)
        
        let emotion = document.createElement('img') 
        card.appendChild(emotion)

        this.board.insertBefore(card, this.board.firstChild)
      
      } 

      if (successful) {

        // throw card in the chosen direction
        this.topCard.style.transform = 
          'translateX(' + posX + 'px) translateY(' + posY + 'px) rotate(' + deg + 'deg)'
    
        // wait transition end
        setTimeout(() => {
          // remove swiped card
          this.board.removeChild(this.topCard)

          // handle gestures on new top card
          this.handle()

          this.movedCard = false
        }, 500)
    
      } else {
        // reset card position
        this.topCard.style.transform =
          'translateX(-50%) translateY(-50%) rotate(0deg)'
        this.movedCard = false
      }
    }
  }

  reveal() {  
    if(this.movedCard) return
    this.topCard.classList.add("reveal")

    setTimeout(() => {
      let index = this.data.findIndex(arr => arr.includes(this.topCard.textContent))
      this.data[index][2] = (this.data[index][2] === 0) ? 1 : 0 
      this.topCard.querySelector('.cardText').textContent = this.data[index][this.data[index][2]]    
    }, 250)

    setTimeout(() => {
      this.topCard.classList.remove("reveal")
    }, 500)

  }

  async getData(chapter) {

    this.board.querySelectorAll('.card').forEach(e => e.remove())
    const url = 'https://hook.we.make.com/en4nrvroy0jle52ijklp7mwtryvblkbj?id=1n7qgq8ZLq23NZe4iCw4W20boGWIte7zpPS3At_j-brI&gid=' + chapter
    let vocab = [[]]

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }
  
      const data = await response.text()
      let counter = 0

      for(let row of data.split("\n")){
        if (counter !== 0) {
          vocab[counter-1] = row.split(',')
          vocab[counter-1][0] = vocab[counter-1][0].replace(/(\r\n|\n|\r)/gm, "")
          vocab[counter-1][1] = vocab[counter-1][1].replace(/(\r\n|\n|\r)/gm, "")
          vocab[counter-1][2] = 0
        }
        counter++
      }
    } catch (error) {
      console.error(error.message)
    }

    return vocab

  }

  showOptions() {
    document.getElementById("chapters").classList.toggle("show");
  }
  
}

let board = document.querySelector('#board')
let carousel = new Carousel(board)
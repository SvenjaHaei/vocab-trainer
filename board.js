class Carousel {
  
  constructor(element) {
    
    this.board = element
    this.onPan = this.onPan.bind(this)
    this.reveal = this.reveal.bind(this)
    this.data = [[]]
    this.knownWords = 0

    // add all cards
    this.addCards()

  }

  addCards() {

    this.getData().then((res) => {

      // add counter
      let counter= document.createElement('div')
      counter.classList.add('counter')
      counter.textContent = '0/'+ res.length
      board.appendChild(counter)

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
      //this.topCard.addEventListener("click", this.reveal)
      this.topCard.addEventListener("dblclick", this.reveal)

    }
    
  }
  
  onPan(e) {

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
      this.isDraggingFrom =
        (e.center.y - bounds.top) > this.topCard.clientHeight / 2 ? -1 : 1
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
    this.topCard.style.transform =
      'translateX(' + posX + 'px) translateY(' + posY + 'px) rotate(' + deg + 'deg)' 

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
  
      this.isPanning = false
      let successful = false

      // check threshold
      if (propX > 0.25) {

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
          }, 500)
      
        } else {

          // reset card position
          this.topCard.style.transform =
            'translateX(-50%) translateY(-50%) rotate(0deg)'

        }

    }
  }

  reveal() {    
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

  async getData() {
    const url = 'https://hook.we.make.com/en4nrvroy0jle52ijklp7mwtryvblkbj?id=1n7qgq8ZLq23NZe4iCw4W20boGWIte7zpPS3At_j-brI'
    let vocab = [[]]

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }
  
      const data = await response.text()
      let counter = 0

      console.log(data)

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
  
}

let board = document.querySelector('#board')

let carousel = new Carousel(board)
import React from 'react';
import axios from 'axios'; 
import { withRouter } from 'react-router-dom';
import io from 'socket.io-client'; 

import "./room.css"; 
class Room extends React.Component<any , any> {
  socket: SocketIOClient.Socket | null = null;
  
  constructor(props:any){
    super(props);
    // path = /room/:room 

    let room = this.props.match.params.room ; 
    let userId = "userId:blabla" + Math.random(); // @todo actual user

    this.state = { 
      room : room ,
      connected : false , 
      users : [] , 
      userId, 
      clickedLetters  : [] , 
      wordLength : 0 , 
      wrongMoves : 0 , 
      stop : false , 
      letters : ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "m", "n", "o", "l", "p", "q", "r", "s", "t", "u", "y", "v", "w", "x", "z"].map(e => ({ letter : e , clikced : false }))
    }; 
    
  }
  getStoreId(){
    let id = localStorage.getItem("id");
    if(!id) return ""; 
    return id ; 
  }
  storeId(id:string){
    localStorage.setItem("id" , id); 
  }
  markLetter(letter:string){
    console.log("Mark Letter " , letter) ; 
    let letters = this.state.letters; 
    let found = letters.find( (e:any) => e.letter == letter ); 
    found.clicked = true ; 
    this.setState({letters});

  }
  updateUserScore(userId:string , value:number ) { 
   
    let user = this.state.users.find( (e:any) => e.id == userId); 
    user.score += value ; 
    this.setState({users : this.state.users}); 

  }
  componentDidMount(){

    const socket = io("http://localhost:3000" );     
    socket.on("connect" , () => {
       console.log("connected to server"); 
       this.setState({connected : true}); 
    });
    socket.on("disconnect" , ()=> {
      console.log("disconnected to server"); 
      this.setState({connected : false}); 
    }); 
   

    socket.on("user-joined" , (users:any) => { // user has joined my room 
      console.log("user joined" , users) ; 
      this.setState({users:users}); 
    }); 
    socket.on("move-recieved" , ( data : any ) => {
      //  data { result , letter  , player }
        if(data.result == false ) { 
          // - score 
          // draw next element 
          this.updateUserScore(data.player , -5 ); 
          let wrongMoves = this.state.wrongMoves + 1; 
          this.setState({wrongMoves }); 


          if(wrongMoves == 5 ) {  // game over 
              alert("game over"); 
              this.setState({stop : true }); 
          }

        }else { 

          this.updateUserScore(data.player , 10 ); 
          this.setState({
            clickedLetters  : [...this.state.clickedLetters , data.letter ]
          }); 

          if(this.state.clickedLetters.length == this.state.wordLength){
            // game won 
            this.setState({stop : true }); 
          }

        }


    })

    socket.on("room-joined" , ( {wordLength , clickedLetters , wrongMoves} : any ) => {
      let stop = false; 
      if(clickedLetters.length == wordLength || wrongMoves == 5 ){
        // if game over or game won 
        stop = true ; 
      }
      this.setState({wordLength , clickedLetters  , wrongMoves  , stop  }); 

    }); 
    socket.emit("join-room" , {room : this.state.room , userId : this.state.userId  }); 
     
    this.socket = socket;  
  }
  isIndexClicked ( index : number ) { 
    // if index exits in clickedLetters return true 
    if ( this.state.clickedLetters.find( (e:any)  => e.index == index ) ) return true  ; 
    return false ; 
  }
  getClickedLetter(index : number ) { 
    return this.state.clickedLetters.find( (e:any) => e.index == index).letter ; 
  }
  letterClick(letter:string){
    if(this.state.stop) return ; 
    this.socket?.emit("move" , {
      player : this.state.userId , 
      move : letter,
      room : this.state.room 
    });
  }
 
  render(){
    return (
      <div className="App">
           <p>
           {this.state.connected && <span>Connected </span>}
           {!this.state.connected && <span>Disconnected </span>}
         </p>

         <div className="user-list">
           <h3>User List</h3>
           <ul>
             { this.state.users.map( (user:any) => <li key={user.id}>User: {user.id} , {user.score} </li>)}
           </ul>
         </div>
         <div className="word">
             {
               
                [...Array(this.state.wordLength)].map( (e , index) => this.isIndexClicked(index) ? <span> {this.getClickedLetter(index)} </span> : <span> _ </span> )
             }
         </div>
         <div className="wrongMoves">
            <p> {this.state.wrongMoves} </p>
         </div>
         <div className="control-wrapper">              
              {this.state.letters.map( (e:any) => <div className={ e.clicked ? "success" : "" }  key={e.letter} onClick= {() => this.letterClick(e.letter) }>{e.letter}</div> )}

         </div>
         
      


      </div>
    );
  } 
}


export default withRouter(Room); 

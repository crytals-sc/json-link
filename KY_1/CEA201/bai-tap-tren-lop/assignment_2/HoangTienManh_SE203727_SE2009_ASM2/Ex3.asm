.386
; .model flat, stdcall  
option casemap:none

include \masm32\include\masm32rt.inc

.data
    msg1 db "Nhap so thu 1 (0-9): ", 0
    msg2 db "Nhap so thu 2 (0-9): ", 0
    msg3 db "Nhap so thu 3 (0-9): ", 0
    sumMsg db "Tong = ", 0
    avgMsg db "Trung binh = ", 0
    userInput db 4 dup(0)       
    sum dd ?
    avg dd ?

.code
main:
    ; Nhap 3 so
    print addr msg1
    invoke StdIn, addr userInput, 4 
    mov al, byte ptr userInput      
    sub al, '0'
    mov bl, al

    print addr msg2
    invoke StdIn, addr userInput, 4
    mov al, byte ptr userInput
    sub al, '0'
    mov bh, al

    print addr msg3
    invoke StdIn, addr userInput, 4
    mov al, byte ptr userInput
    sub al, '0'
    mov cl, al

    ; Tinh tong
    movzx eax, bl    
    movzx ebx, bh     
    movzx ecx, cl     
    
    add eax, ebx      
    add eax, ecx      
    mov sum, eax      


    cdq               
    mov ebx, 3       
    idiv ebx          
    mov avg, eax      


    print addr sumMsg
    print str$(sum)
    print chr$(13,10)
    print addr avgMsg
    print str$(avg)
    print chr$(13,10)

    exit
end main

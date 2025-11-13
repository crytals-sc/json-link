.386
option casemap:none

include \masm32\include\masm32rt.inc

.data
    msg1 db "Enter a (0-9): ", 0
    msg2 db "Enter b (0-9): ", 0
    msg3 db "No solution (a=0)", 0
    msg4 db "x = ", 0
    
    userInput db 4 dup(0)
    a dd ?
    b dd ?
    x dd ?

.code
main:
    print addr msg1
    invoke StdIn, addr userInput, 4
    mov al, byte ptr userInput
    sub al, '0'
    movzx eax, al
    mov a, eax

    print chr$(13,10)
    print addr msg2
    invoke StdIn, addr userInput, 4
    mov al, byte ptr userInput
    sub al, '0'
    movzx eax, al
    mov b, eax

    mov eax, a
    cmp eax, 0
    je no_solution

    mov eax, b
    neg eax
    cdq
    mov ebx, a
    idiv ebx
    
    mov x, eax

    print chr$(13,10)
    print addr msg4
    print str$(x)
    jmp done

no_solution:
    print chr$(13,10)
    print addr msg3

done:
    print chr$(13,10)
    exit
end main

